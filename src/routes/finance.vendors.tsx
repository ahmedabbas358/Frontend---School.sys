import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Users, Plus, Phone, Mail, FileText, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
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
    addVendor({
      name: formData.get("name") as string,
      contactPerson: formData.get("contactPerson") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      taxId: formData.get("taxId") as string,
      balance: Number(formData.get("balance") || 0),
    });
    toast.success("تم إضافة المورد بنجاح");
    setAddVendorModal(false);
  };

  const handlePayVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!payModalData) return;
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const method = formData.get("method") as "cash" | "bank_transfer";
    const notes = formData.get("notes") as string;

    payVendor(payModalData.id, amount, method, notes);
    toast.success("تم تسجيل سند الصرف بنجاح");
    setPayModalData(null);
  };

  const filteredVendors = allVendors.filter((v: any) => 
    v.name.includes(q) || (v.contactPerson && v.contactPerson.includes(q))
  );

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance" },
        { label: "الموردين (الذمم الدائنة)" },
      ]}
      actions={
        <button onClick={() => setAddVendorModal(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 text-sm font-bold shadow-sm hover:bg-primary/90 transition-all">
          <Plus className="h-4 w-4" /> إضافة مورد جديد
        </button>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PageCard className="p-6 flex flex-col justify-center items-center text-center">
            <Users className="w-10 h-10 text-primary mb-2" />
            <p className="text-sm font-bold text-muted-foreground">إجمالي الموردين</p>
            <p className="text-3xl font-black mt-2">{allVendors.length}</p>
          </PageCard>
          <PageCard className="p-6 flex flex-col justify-center items-center text-center bg-danger/5 border-danger/20">
            <FileText className="w-10 h-10 text-danger mb-2" />
            <p className="text-sm font-bold text-muted-foreground">إجمالي الأرصدة المستحقة (للموردين)</p>
            <p className="text-3xl font-black mt-2 text-danger">
              {allVendors.reduce((sum: number, v: any) => sum + v.balance, 0).toLocaleString()} {currency}
            </p>
          </PageCard>
          <PageCard className="p-6 flex flex-col justify-center items-center text-center">
            <CheckCircle2 className="w-10 h-10 text-success mb-2" />
            <p className="text-sm font-bold text-muted-foreground">فواتير مدفوعة (هذا الشهر)</p>
            <p className="text-3xl font-black mt-2">0</p>
          </PageCard>
        </div>

        {/* Vendors List */}
        <PageCard>
          <div className="p-4 border-b border-border/50 flex justify-between items-center">
            <div className="relative w-full md:w-96">
              <input 
                type="text"
                placeholder="البحث باسم المورد أو مسؤول التواصل..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 text-right font-bold text-muted-foreground">اسم المورد</th>
                  <th className="px-4 py-3 text-right font-bold text-muted-foreground">مسؤول التواصل</th>
                  <th className="px-4 py-3 text-right font-bold text-muted-foreground">الرصيد المستحق</th>
                  <th className="px-4 py-3 text-center font-bold text-muted-foreground">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground font-bold">لا يوجد موردين</td>
                  </tr>
                ) : (
                  filteredVendors.map(vendor => (
                    <tr key={vendor.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-bold">{vendor.name}</div>
                        {vendor.taxId && <div className="text-xs text-muted-foreground mt-1 font-mono">الرقم الضريبي: {vendor.taxId}</div>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{vendor.contactPerson || '-'}</div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          {vendor.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {vendor.phone}</span>}
                          {vendor.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {vendor.email}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-black ${vendor.balance > 0 ? 'text-danger' : 'text-success'}`}>
                          {vendor.balance.toLocaleString()} {currency}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button className="btn-secondary text-xs h-8">كشف الحساب</button>
                          <button onClick={() => setPayModalData({ id: vendor.id, name: vendor.name, balance: vendor.balance })} className="btn-primary text-xs h-8 bg-success hover:bg-success/90">تسديد دفعة (سند صرف)</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </PageCard>

      </div>

      {/* Add Vendor Modal */}
      {addVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
              <h3 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> إضافة مورد جديد</h3>
              <button onClick={() => setAddVendorModal(false)} className="p-1 hover:bg-accent rounded-md"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddVendor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">اسم المورد</label>
                <input type="text" name="name" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1">مسؤول التواصل</label>
                  <input type="text" name="contactPerson" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1">رقم الهاتف</label>
                  <input type="text" name="phone" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1">البريد الإلكتروني</label>
                  <input type="email" name="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1">الرقم الضريبي</label>
                  <input type="text" name="taxId" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">الرصيد الافتتاحي (دائن)</label>
                <input type="number" name="balance" defaultValue={0} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 btn-primary">حفظ المورد</button>
                <button type="button" onClick={() => setAddVendorModal(false)} className="flex-1 btn-secondary">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Vendor Modal */}
      {payModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
              <h3 className="font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success" /> تسديد دفعة (سند صرف)</h3>
              <button onClick={() => setPayModalData(null)} className="p-1 hover:bg-accent rounded-md"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handlePayVendor} className="p-6 space-y-4">
              <div className="p-3 bg-muted rounded-lg flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-muted-foreground">اسم المورد:</span>
                <span className="font-bold">{payModalData.name}</span>
              </div>
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-danger">الرصيد المستحق عليه:</span>
                <span className="font-black text-danger text-lg">{payModalData.balance.toLocaleString()} {currency}</span>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">مبلغ الدفعة ({currency})</label>
                <input type="number" name="amount" required min="1" max={payModalData.balance} defaultValue={payModalData.balance} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">طريقة الدفع</label>
                <select name="method" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50">
                  <option value="cash">نقداً من الخزينة</option>
                  <option value="bank_transfer">تحويل من البنك</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">البيان / ملاحظات</label>
                <input type="text" name="notes" placeholder="مثال: دفعة تحت الحساب" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 btn-primary bg-success hover:bg-success/90">تأكيد الدفع</button>
                <button type="button" onClick={() => setPayModalData(null)} className="flex-1 btn-secondary">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppShell>
  );
}
