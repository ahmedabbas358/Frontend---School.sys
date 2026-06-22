import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { User, FileText, Calendar, DollarSign, Wallet, ArrowUpRight } from "lucide-react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useMemo } from "react";

export const Route = createFileRoute("/hr/staff/$id")({
  component: HrStaffReview,
});

function HrStaffReview() {
  const { id } = Route.useParams();
  const { currency, allStaff, allExpenses  } = useGlobalStore();

  const staffData = useMemo(() => {
    return allStaff.find(s => s.id === id) || {
      id: id,
      name: "غير معروف",
      role: "موظف",
      department: "غير محدد",
      status: "terminated" as any,
      basicSalary: 0,
      allowance: 0,
      deduction: 0
    };
  }, [id, allStaff]);

  // Find salary expenses (paid salaries) for this specific staff member
  const staffPayments = useMemo(() => {
    return allExpenses.filter(
      e => e.recipient === staffData.name && e.category === "رواتب وأجور"
    );
  }, [allExpenses, staffData]);

  const totalPaidOut = staffPayments.reduce((acc, curr) => acc + curr.amount, 0);

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
                <span className="font-medium">0501234567</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">البريد الإلكتروني:</span>
                <span className="font-medium">saeed@school.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">العنوان:</span>
                <span className="font-medium">الرياض، حي الياسمين</span>
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

          <div className="grid gap-6 sm:grid-cols-2">
            <PageCard>
              <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-bold">رصيد الإجازات</h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">الرصيد المتبقي:</span>
                <span className="text-2xl font-bold text-primary">14 يوم</span>
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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
