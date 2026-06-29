import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { User, FileText, Calendar, Wallet, ArrowUpRight, Plus, HandCoins, Clock, Star, FileBadge, ClipboardCheck, BookOpen } from "lucide-react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/staff/$id")({
  component: HrStaffReview,
});

function HrStaffReview() {
  const { id } = Route.useParams();
  const {
    currency,
    allStaff,
    allExpenses,
    allStaffAdvances,
    allStaffLeaves,
    allStaffContracts,
    allStaffEvaluations,
    allStaffAttendance,
    allTeachingAssignments,
    allSubjects,
    allSections,
    addStaffAdvance,
    addExpense,
  } = useGlobalStore();
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceMonth, setAdvanceMonth] = useState("2023-11");

  const staffData = useMemo(() => {
    return allStaff.find(s => s.id === id) || {
      id: id,
      name: "غير معروف",
      role: "موظف",
      department: "غير محدد",
      status: "terminated" as any,
      stage: "all" as const,
      phone: "",
      email: "",
      basicSalary: 0,
      allowance: 0,
      deduction: 0
    };
  }, [id, allStaff]);

  const staffPayments = useMemo(() => {
    return allExpenses.filter(
      e => e.categoryId === "EXPCAT-1" && (e.beneficiary === staffData.name || e.title.includes(staffData.name))
    );
  }, [allExpenses, staffData]);

  const totalPaidOut = staffPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const staffAdvances = useMemo(() => {
    return allStaffAdvances.filter(a => a.staffId === id);
  }, [allStaffAdvances, id]);

  const staffLeaves = useMemo(() => allStaffLeaves.filter(item => item.staffId === id), [allStaffLeaves, id]);
  const staffContracts = useMemo(() => allStaffContracts.filter(item => item.staffId === id), [allStaffContracts, id]);
  const staffEvaluations = useMemo(() => allStaffEvaluations.filter(item => item.staffId === id), [allStaffEvaluations, id]);
  const staffAttendance = useMemo(
    () => allStaffAttendance.filter(item => item.staffId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [allStaffAttendance, id]
  );
  const staffAssignments = useMemo(() => {
    return allTeachingAssignments.filter(item => item.teacherId === id).map(item => {
      const subject = allSubjects.find(subjectItem => subjectItem.id === item.subjectId);
      const section = allSections.find(sectionItem => sectionItem.id === item.sectionId);
      return {
        id: item.id,
        subject: subject?.name || "مادة غير محددة",
        section: section ? `${section.grade} - ${section.name}` : "شعبة غير محددة",
      };
    });
  }, [allSections, allSubjects, allTeachingAssignments, id]);

  const approvedAnnualDays = staffLeaves
    .filter(item => item.status === "approved" && item.type === "annual")
    .reduce((sum, item) => sum + item.days, 0);
  const leaveBalance = Math.max(0, 21 - approvedAnnualDays);
  const attendanceImpact = staffAttendance.reduce((sum, item) => sum + (item.deductionAmount || 0), 0);
  const latestContract = staffContracts[0];
  const latestEvaluation = staffEvaluations[0];

  const handleRequestAdvance = () => {
    const amount = Number(advanceAmount);
    if (!amount || amount <= 0) {
      toast.error("الرجاء إدخال مبلغ صحيح");
      return;
    }

    // 1. Add Advance Record
    addStaffAdvance({
      staffId: id,
      staffName: staffData.name,
      amount,
      date: new Date().toISOString().split('T')[0],
      status: "paid", // Auto-approved for this demo
      deductionMonth: advanceMonth,
      notes: "سلفة نقدية مستعجلة"
    });

    // 2. Automatically Link to Finance Expenses
    addExpense({
      title: `سلفة موظف - ${staffData.name} - خصم شهر ${advanceMonth}`,
      amount,
      date: new Date().toISOString().split('T')[0],
      categoryId: "EXPCAT-6", // سلف وعهد
      beneficiary: staffData.name,
      method: "bank_transfer",
      notes: "تم تسجيلها تلقائياً من نظام شؤون الموظفين"
    });

    toast.success("تم تسجيل السلفة النقدية وإرسالها لقسم المالية بنجاح!");
    setAdvanceAmount("");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الموارد البشرية", to: "/hr/staff" },
        { label: `ملف الموظف #${id}` },
      ]}
      actions={
        <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          تعديل الملف
        </button>
      }
    >
      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <PageCard>
            <div className="flex flex-col items-center justify-center p-4">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-12 w-12" />
              </div>
              <h2 className="text-xl font-bold">{staffData.name}</h2>
              <p className="text-muted-foreground">{staffData.role} - {staffData.department}</p>
              <Badge tone={staffData.status === 'active' ? 'success' : staffData.status === 'on_leave' ? 'warning' : 'danger'} className="mt-2">
                {staffData.status === 'active' ? 'على رأس العمل' : staffData.status === 'on_leave' ? 'في إجازة' : 'منهي خدماته'}
              </Badge>
            </div>
          </PageCard>

          <PageCard>
            <h3 className="mb-4 font-bold border-b border-border pb-2">معلومات الاتصال</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم الجوال:</span>
                <span className="font-medium">{staffData.phone || "غير مسجل"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">البريد الإلكتروني:</span>
                <span className="font-medium">{staffData.email || "غير مسجل"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">نطاق العمل:</span>
                <span className="font-medium">{staffData.stage === "all" ? "كل المراحل" : staffData.stage}</span>
              </div>
            </div>
          </PageCard>
        </div>

        <div className="space-y-6">
          <PageCard>
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">البيانات الوظيفية</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">الرقم الوظيفي</p>
                <p className="font-bold">{staffData.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">القسم</p>
                <p className="font-bold">{staffData.department}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الراتب الأساسي</p>
                <p className="font-bold tabular-nums">{(staffData as any).basicSalary || 5000} {currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">البدلات</p>
                <p className="font-bold tabular-nums text-success">+{(staffData as any).allowance || 0} {currency}</p>
              </div>
            </div>
          </PageCard>

          <PageCard>
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">مركز الترابط التشغيلي</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="text-xs font-bold text-muted-foreground">العقود</div>
                <div className="mt-1 text-xl font-black">{staffContracts.length}</div>
                <div className="text-xs text-muted-foreground">{latestContract ? `ينتهي: ${latestContract.endDate}` : "لا يوجد عقد"}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="text-xs font-bold text-muted-foreground">الإجازات</div>
                <div className="mt-1 text-xl font-black">{staffLeaves.length}</div>
                <div className="text-xs text-muted-foreground">الرصيد السنوي: {leaveBalance} يوم</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="text-xs font-bold text-muted-foreground">الحضور</div>
                <div className="mt-1 text-xl font-black">{staffAttendance.length}</div>
                <div className="text-xs text-muted-foreground">أثر مالي: {attendanceImpact.toLocaleString()} {currency}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="text-xs font-bold text-muted-foreground">آخر تقييم</div>
                <div className="mt-1 text-xl font-black">{latestEvaluation ? `${latestEvaluation.overallScore.toFixed(1)} / 5` : "-"}</div>
                <div className="text-xs text-muted-foreground">{latestEvaluation?.period || "لا يوجد تقييم"}</div>
              </div>
            </div>
          </PageCard>

          <div className="grid gap-6 sm:grid-cols-2">
            <PageCard>
              <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-bold">رصيد الإجازات</h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">الرصيد المتبقي:</span>
                <span className="text-2xl font-bold text-primary">{leaveBalance} يوم</span>
              </div>
            </PageCard>

            <PageCard>
              <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                <Wallet className="h-5 w-5 text-primary" />
                <h3 className="font-bold">الرواتب المصروفة (المالية)</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-primary/5 p-3 rounded-xl border border-primary/20">
                  <span className="text-sm font-bold text-primary">إجمالي ما تم صرفه:</span>
                  <span className="text-xl font-black text-primary tabular-nums">{totalPaidOut.toLocaleString()} {currency}</span>
                </div>
                <div className="space-y-2 mt-4">
                  {staffPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center italic mt-4">لم يتم تسجيل أي عمليات صرف رواتب بعد.</p>
                  ) : (
                    staffPayments.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 border border-border/50 rounded-lg hover:bg-accent/50 transition-colors text-sm">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-success/10 text-success"><ArrowUpRight className="h-3 w-3" /></div>
                          <div>
                            <p className="font-bold">{p.title}</p>
                            <p className="text-xs text-muted-foreground tabular-nums">{p.date}</p>
                          </div>
                        </div>
                        <span className="font-black tabular-nums">{p.amount.toLocaleString()} {currency}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </PageCard>

            <PageCard className="col-span-full">
              <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-bold">الإسناد التدريسي المرتبط</h3>
              </div>
              {staffAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد إسنادات تدريسية مرتبطة بهذا الموظف.</p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {staffAssignments.map(item => (
                    <div key={item.id} className="rounded-lg border border-border p-3 text-sm">
                      <div className="font-bold">{item.subject}</div>
                      <div className="text-xs text-muted-foreground">{item.section}</div>
                    </div>
                  ))}
                </div>
              )}
            </PageCard>

            <PageCard className="col-span-full">
              <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-bold">آخر الحضور والإجازات والتقييمات</h3>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold"><Clock className="h-4 w-4 text-primary" /> الحضور</div>
                  {staffAttendance.slice(0, 4).map(item => (
                    <div key={item.id} className="rounded-lg border border-border p-2 text-sm">
                      <div className="flex justify-between"><span className="font-bold">{item.date}</span><Badge tone={item.status === "present" ? "success" : item.status === "late" ? "warning" : item.status === "excused" ? "info" : "danger"}>{item.status === "present" ? "حاضر" : item.status === "late" ? "متأخر" : item.status === "excused" ? "بعذر" : "غائب"}</Badge></div>
                      <div className="text-xs text-muted-foreground">خصم: {(item.deductionAmount || 0).toLocaleString()} {currency}</div>
                    </div>
                  ))}
                  {staffAttendance.length === 0 && <p className="text-sm text-muted-foreground">لا توجد سجلات حضور.</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold"><FileBadge className="h-4 w-4 text-primary" /> الإجازات</div>
                  {staffLeaves.slice(0, 4).map(item => (
                    <div key={item.id} className="rounded-lg border border-border p-2 text-sm">
                      <div className="flex justify-between"><span className="font-bold">{item.startDate}</span><Badge tone={item.status === "approved" ? "success" : item.status === "pending" ? "warning" : "danger"}>{item.status === "approved" ? "معتمدة" : item.status === "pending" ? "قيد المراجعة" : "مرفوضة"}</Badge></div>
                      <div className="text-xs text-muted-foreground">{item.days} يوم</div>
                    </div>
                  ))}
                  {staffLeaves.length === 0 && <p className="text-sm text-muted-foreground">لا توجد إجازات.</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold"><Star className="h-4 w-4 text-primary" /> التقييمات</div>
                  {staffEvaluations.slice(0, 4).map(item => (
                    <div key={item.id} className="rounded-lg border border-border p-2 text-sm">
                      <div className="flex justify-between"><span className="font-bold">{item.period}</span><span className="font-black text-primary">{item.overallScore.toFixed(1)} / 5</span></div>
                      <div className="text-xs text-muted-foreground">المقيم: {item.evaluator}</div>
                    </div>
                  ))}
                  {staffEvaluations.length === 0 && <p className="text-sm text-muted-foreground">لا توجد تقييمات.</p>}
                </div>
              </div>
            </PageCard>

            <PageCard className="col-span-full">
              <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                <HandCoins className="h-5 w-5 text-primary" />
                <h3 className="font-bold">إدارة السلف النقدية (تكامل مالي)</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <p className="text-sm font-bold">طلب سلفة جديدة</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input 
                        type="number" 
                        placeholder="المبلغ" 
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="month" 
                        value={advanceMonth}
                        onChange={(e) => setAdvanceMonth(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <button 
                      onClick={handleRequestAdvance}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" /> اعتماد السلفة
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    عند اعتماد السلفة، سيتم ترحيلها تلقائياً كـ (مصروف) في قسم المحاسبة والمالية للتسوية.
                  </p>
                </div>
                
                <div className="space-y-3 border-r border-border pr-6">
                  <p className="text-sm font-bold">سجل السلف</p>
                  {staffAdvances.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">لا توجد سلف مسجلة.</p>
                  ) : (
                    <div className="space-y-2">
                      {staffAdvances.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 text-sm">
                          <div>
                            <p className="font-bold">{a.amount} {currency}</p>
                            <p className="text-xs text-muted-foreground">شهر الخصم: {a.deductionMonth}</p>
                          </div>
                          <Badge tone="success">{a.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PageCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
