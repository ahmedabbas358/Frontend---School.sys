import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { Check, X, FileText, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admissions/$id")({
  component: AdmissionsReview,
});

function AdmissionsReview() {
  const { id } = Route.useParams();

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "القبول والتسجيل", to: "/admissions" },
        { label: `طلب #${id}` },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.error("تم رفض الطلب")}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-danger px-4 text-sm font-bold text-danger-foreground hover:bg-danger/90"
          >
            <X className="h-4 w-4" /> رفض
          </button>
          <button
            onClick={() => toast.success("تم قبول الطلب وتحويله إلى طالب")}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-success px-4 text-sm font-bold text-success-foreground hover:bg-success/90"
          >
            <Check className="h-4 w-4" /> قبول نهائي
          </button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <PageCard>
            <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">معلومات الطالب المتقدم</h2>
              <Badge tone="warning">قيد المراجعة</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                <p className="font-bold">أحمد محمد محمود</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رقم الهوية</p>
                <p className="font-bold">1098765432</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الميلاد</p>
                <p className="font-bold">2015-05-12</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الصف المتقدم له</p>
                <p className="font-bold">الصف الأول الابتدائي</p>
              </div>
            </div>
          </PageCard>

          <PageCard>
            <div className="mb-4 border-b border-border pb-4">
              <h2 className="text-lg font-bold">المستندات المرفقة</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">صورة الهوية.pdf</span>
                </div>
                <button className="text-primary hover:underline"><Download className="h-4 w-4" /></button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">شهادة الميلاد.pdf</span>
                </div>
                <button className="text-primary hover:underline"><Download className="h-4 w-4" /></button>
              </div>
            </div>
          </PageCard>
        </div>

        <div className="space-y-6">
          <PageCard>
            <h2 className="mb-4 text-lg font-bold">ملاحظات الإدارة</h2>
            <textarea
              className="min-h-[150px] w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="اكتب ملاحظاتك حول الطلب هنا..."
            ></textarea>
          </PageCard>
        </div>
      </div>
    </AppShell>
  );
}
