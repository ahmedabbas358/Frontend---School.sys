import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Users, Plus, Phone, Mail, FileText, CheckCircle2, X, CreditCard, DollarSign, Building } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/vendors")({
  component: FinanceVendors,
});

function FinanceVendors() {
  const { allVendors, currency, addVendor, payVendor } = useGlobalStore();
  const [q, setQ] = useState("");

  const [addVendorModal, setAddVendorModal] = useState(false);
  const [payModalData, setPayModalData] = useState<{ id: string, name: string, balance: number } | null>(null);

  const handleAddVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    if (!name) {
      toast.error("اسم المورد أو الشركة مطلوب");
      return;
    }

    addVendor({
      name,
      contactPerson: formData.get("contactPerson") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      taxId: formData.get("taxId") as string,
      balance: Number(formData.get("balance") || 0),
    });
    toast.success("تم تسجيل المورد في السجل التجاري والمالي بنجاح");
    setAddVendorModal(false);
  };

  const handlePayVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!payModalData) return;
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const method = formData.get("method") as "cash" | "bank_transfer";

    if (!amount || amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    payVendor(payModalData.id, amount);
    toast.success(`تم سداد مبلغ ${amount.toLocaleString()} ${currency} للمورد ${payModalData.name} وتخفيض الالتزامات بنجاح`);
    setPayModalData(null);
  };

  const filteredVendors = useMemo(() => {
    return allVendors.filter((v: any) => {
      if (q) {
        const qLower = q.toLowerCase();
        const matchName = v.name.toLowerCase().includes(qLower);
        const matchContact = v.contactPerson?.toLowerCase().includes(qLower);
        const matchTax = v.taxId?.toLowerCase().includes(qLower);
        if (!matchName && !matchContact && !matchTax) return false;
      }
      return true;
    });
  }, [allVendors, q]);

  const aggregateStats = useMemo(() => {
    const totalVendors = allVendors.length;
    const totalBalance = allVendors.reduce((sum: number, v: any) => sum + (v.balance || 0), 0);
    const activeVendorsWithBalance = allVendors.filter((v: any) => v.balance > 0).length;
    return { totalVendors, totalBalance, activeVendorsWithBalance };
  }, [allVendors]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance/dashboard" },
        { label: "سجل الموردين والمقاولين (الذمم الدائنة)" },
      ]}
      actions={
        <button 
          onClick={() => setAddVendorModal(true)} 
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 text-xs font-extrabold shadow-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="h-4 w-4" /> إضافة مورد / شركة جديدة
        </button>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PageCard className="p-4 flex items-center gap-4 bg-card border border-border/50 rounded-2xl shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><Building className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي الموردين والشركات</p>
              <p className="text-2xl font-black tabular-nums">{aggregateStats.totalVendors}</p>
            </div>
          </PageCard>
          <PageCard className="p-4 flex items-center gap-4 border-l-4 border-l-danger rounded-2xl shadow-sm">
            <div className="p-3 bg-danger/10 text-danger rounded-xl"><FileText className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي المستحقات الدائنة للموردين</p>
              <p className="text-xl font-black tabular-nums text-danger">{aggregateStats.totalBalance.toLocaleString()} {currency}</p>
            </div>
          </PageCard>
          <PageCard className="p-4 flex items-center gap-4 border-l-4 border-l-amber-500 rounded-2xl shadow-sm">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><CreditCard className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">موردين بحاجة لسداد فوري</p>
              <p className="text-xl font-black tabular-nums text-amber-600">{aggregateStats.activeVendorsWithBalance} مورد</p>
            </div>
          </PageCard>
        </div>

        {/* Vendors Data Table */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <DataTable
            columns={[
              { 
                key: "name", 
                header: "اسم المورد والشركة", 
                cell: (v: any) => (
                  <div>
                    <div className="font-extrabold text-sm">{v.name}</div>
                    {v.taxId && <div className="text-xs text-muted-foreground font-mono mt-0.5">الرقم الضريبي: {v.taxId}</div>}
                  </div>
                )
              },
              { 
                key: "contactPerson", 
                header: "مسؤول التواصل والبيانات", 
                cell: (v: any) => (
                  <div>
                    <div className="font-bold text-xs">{v.contactPerson || "-"}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {v.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {v.phone}</span>}
                      {v.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {v.email}</span>}
                    </div>
                  </div>
                )
              },
              { 
                key: "balance", 
                header: "الرصيد المستحق (دائن)", 
                cell: (v: any) => (
                  <span className={`font-black tabular-nums text-base ${v.balance > 0 ? "text-danger" : "text-success"}`}>
                    {v.balance.toLocaleString()} {currency}
                  </span>
                )
              },
              { 
                key: "status", 
                header: "الحالة المالية", 
                cell: (v: any) => (
                  v.balance > 0 ? <Badge tone="danger">مستحقات معلقة</Badge> : <Badge tone="success">رصيد مسوى</Badge>
                )
              },
              { 
                key: "actions", 
                header: "إجراءات السداد", 
                cell: (v: any) => (
                  <button 
                    onClick={() => setPayModalData({ id: v.id, name: v.name, balance: v.balance })}
                    className="text-xs font-extrabold bg-success/10 text-success hover:bg-success hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> سداد مستحقات
                  </button>
                )
              }
            ]}
            rows={filteredVendors}
            pageSize={10}
            pageSizeOptions={[10, 25, 50]}
            empty="لا يوجد موردين مسجلين يطابقون شروط البحث"
          />
        </div>
      </div>

      {/* --- Add Vendor Modal --- */}
      {addVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border/50 flex justify-between items-center bg-primary/10">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-primary"><Plus className="w-5 h-5" /> إضافة مورد / شركة جديدة</h3>
              <button onClick={() => setAddVendorModal(false)} className="p-1 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddVendor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">اسم المورد / الشركة <span className="text-danger">*</span></label>
                <input type="text" name="name" required placeholder="مثال: شركة التجهيزات المدرسية" className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/40 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">مسؤول التواصل / المندوب</label>
                <input type="text" name="contactPerson" placeholder="اسم الشخص المسؤول..." className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/40 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">رقم الهاتف</label>
                  <input type="text" name="phone" placeholder="05xxxxxxxx" className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">الرقم الضريبي (VAT)</label>
                  <input type="text" name="taxId" placeholder="300xxxxxxxxx" className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 outline-none font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">الرخص الافتتاحي المعلق ({currency})</label>
                <input type="number" name="balance" defaultValue="0" min="0" className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/40 outline-none" />
              </div>
              <div className="pt-3 flex gap-3">
                <button type="submit" className="flex-1 btn-primary font-extrabold py-2.5 rounded-xl">حفظ المورد</button>
                <button type="button" onClick={() => setAddVendorModal(false)} className="flex-1 btn-secondary py-2.5 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Pay Vendor Modal --- */}
      {payModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border/50 flex justify-between items-center bg-success/10">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-success"><CreditCard className="w-5 h-5" /> سداد مستحقات المورد</h3>
              <button onClick={() => setPayModalData(null)} className="p-1 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handlePayVendor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">اسم المورد</label>
                <div className="p-3 bg-muted/50 rounded-xl font-extrabold text-sm">{payModalData.name}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">الرخص المستحق حالياً</label>
                <div className="p-3 bg-danger/10 text-danger rounded-xl font-black text-base tabular-nums">{payModalData.balance.toLocaleString()} {currency}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">المبلغ المراد سداده ({currency}) <span className="text-danger">*</span></label>
                <input type="number" name="amount" required defaultValue={payModalData.balance} max={payModalData.balance} min="1" className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-base focus:ring-2 focus:ring-success/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">طريقة السداد</label>
                <select name="method" required className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-success/50 outline-none">
                  <option value="bank_transfer">تحويل بنكي مباشر</option>
                  <option value="cash">نقداً (كاش الصندوق)</option>
                </select>
              </div>
              <div className="pt-3 flex gap-3">
                <button type="submit" className="flex-1 btn-primary bg-success hover:bg-success/90 font-extrabold py-2.5 rounded-xl">تأكيد السداد</button>
                <button type="button" onClick={() => setPayModalData(null)} className="flex-1 btn-secondary py-2.5 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppShell>
  );
}
