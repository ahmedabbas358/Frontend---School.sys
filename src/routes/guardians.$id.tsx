import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { User, Phone, MapPin, Printer, GraduationCap, FileText, AlertTriangle, CreditCard, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialTimeline } from "@/components/financial-components";

export const Route = createFileRoute("/guardians/$id")({
  head: () => ({
    meta: [{ title: "ملف ولي الأمر | منصة مدارس" }],
  }),
  component: GuardianProfile,
});

function GuardianProfile() {
  const { id } = Route.useParams();
  const { currency, allStudents, allInvoices, allPayments, addPayment, allGuardians } = useGlobalStore();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [paymentData, setPaymentData] = useState({
    invoiceId: "",
    amount: 0,
    method: "cash" as "cash" | "bank_transfer" | "card" | "cheque"
  });

  const guardianData = useMemo(() => {
    const guardian = allGuardians.find(g => g.id === id);
    
    if (guardian) {
      const students = allStudents.filter(s => 
        (s.guardianPhone === guardian.phone && s.guardianPhone) || 
        (s.guardianName === guardian.name && s.guardianName)
      );
      return {
        id: guardian.id,
        name: guardian.name,
        phone: guardian.phone,
        relation: guardian.relation,
        address: "غير محدد",
        students: students
      };
    }

    // Fallback for legacy links where phone number was passed as ID
    const students = allStudents.filter(s => s.guardianPhone === id);
    if (students.length === 0) return null;
    
    return {
      id: students[0].guardianPhone,
      name: students[0].guardianName || "غير محدد",
      phone: students[0].guardianPhone || "غير محدد",
      relation: students[0].guardianRelation || "ولي أمر",
      address: students[0].address || "غير محدد",
      students: students
    };
  }, [id, allStudents, allGuardians]);

  if (!guardianData) {
    return (
      <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "أولياء الأمور", to: "/guardians" }, { label: "غير موجود" }]}>
        <PageCard>
          <div className="p-8 text-center text-muted-foreground font-bold">
            لم يتم العثور على ولي الأمر المطلوب.
          </div>
        </PageCard>
      </AppShell>
    );
  }

  // Calculate financial summary
  const studentIds = guardianData.students.map(s => s.id);
  const guardianInvoices = allInvoices.filter(inv => studentIds.includes(inv.studentId));
  const totalAmount = guardianInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = guardianInvoices.reduce((sum, inv) => sum + inv.paid, 0);
  const totalDue = totalAmount - totalPaid;

  const guardianTransactions = useMemo(() => {
    const invoices = guardianInvoices.map(i => {
      const student = guardianData.students.find(s => s.id === i.studentId);
      return {
        id: `inv-${i.id}`,
        date: i.issueDate || i.dueDate,
        title: `إصدار فاتورة: ${i.title}`,
        subtitle: `للطالب: ${student?.name || 'غير محدد'}`,
        amount: i.amount,
        type: "expense" as const, 
        currency
      };
    });
    const payments = allPayments.filter(p => p.studentId && studentIds.includes(p.studentId)).map(p => {
      const student = guardianData.students.find(s => s.id === p.studentId);
      return {
        id: `pay-${p.id}`,
        date: p.date,
        title: `سداد دفعة`,
        subtitle: `للطالب: ${student?.name || 'غير محدد'} - ${p.method === 'cash' ? 'نقدي' : p.method === 'bank_transfer' ? 'حوالة بنكية' : 'بطاقة ائتمان'}`,
        amount: p.amount,
        type: "income" as const,
        currency,
        method: p.method
      };
    });
    
    return [...invoices, ...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [guardianInvoices, allPayments, guardianData, studentIds, currency]);

  const printTemplates: PrintTemplate[] = [
    {
      id: "guardian-summon",
      name: "إشعار استدعاء ولي أمر",
      category: "مراسلات",
      type: "document",
      description: "طباعة نموذج استدعاء رسمي لولي الأمر للحضور للمدرسة",
      renderDocument: () => (
        <div className="space-y-6 text-lg leading-relaxed p-6 border-4 border-double border-gray-400 rounded-xl bg-white text-black">
          <div className="text-center mb-10 border-b-2 border-gray-400 pb-6">
            <h1 className="text-3xl font-black mb-2">إشعار استدعاء ولي أمر</h1>
            <p className="font-bold text-gray-600">إدارة التوجيه والإرشاد الطلابي</p>
          </div>
          
          <div className="mb-8">
            <p className="font-bold text-xl mb-4">المكرم ولي الأمر / {guardianData.name} المحترم،</p>
            <p>السلام عليكم ورحمة الله وبركاته، وبعد...</p>
          </div>

          <p className="text-justify mb-6">
            نأمل منكم التكرم بمراجعة إدارة المدرسة (وكيل شؤون الطلاب / الموجه الطلابي)، وذلك للأهمية القصوى لمناقشة بعض الأمور المتعلقة بأبنائكم، وذلك يوم (...........................) الموافق (..../..../........هـ) في تمام الساعة (.................).
          </p>

          <div className="bg-gray-100 p-6 rounded-xl border border-gray-300 mb-8">
            <h4 className="font-bold text-gray-700 text-base mb-2">الأبناء المقيدون بالمدرسة:</h4>
            <ul className="list-disc list-inside space-y-2">
              {guardianData.students.map(s => (
                <li key={s.id} className="font-bold">{s.name} - {s.grade}</li>
              ))}
            </ul>
          </div>

          <p className="text-justify font-bold mb-12">
            نظراً لأهمية الموضوع وحرصاً منا على مصلحة أبنائكم، نؤكد على ضرورة حضوركم في الموعد المحدد.
          </p>

          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-300">
            <div className="text-center">
              <p className="font-bold mb-2">الختم الرسمي</p>
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-400 mx-auto"></div>
            </div>
            <div className="text-center">
              <p className="font-bold mb-8">مدير المدرسة</p>
              <p>.......................................</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "financial-statement",
      name: "كشف حساب مالي شامل",
      category: "مالي",
      type: "document",
      description: "طباعة كشف حساب مجمع لجميع أبناء ولي الأمر",
      renderDocument: () => (
        <div className="p-6 bg-white text-black">
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
            <h1 className="text-3xl font-black mb-2">كشف حساب مالي - مجمع</h1>
            <p className="font-bold text-gray-600">التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
          </div>

          <div className="flex justify-between items-center bg-gray-100 p-6 rounded-xl border border-gray-300 mb-8">
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">اسم ولي الأمر</p>
              <p className="text-xl font-black">{guardianData.name}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">رقم الجوال</p>
              <p className="text-xl font-black tabular-nums">{guardianData.phone}</p>
            </div>
          </div>

          <h3 className="text-xl font-black mb-4">تفاصيل الرسوم المدرسية للأبناء:</h3>
          <table className="w-full border-collapse border border-gray-400 mb-8 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 p-3 text-right font-bold">اسم الطالب</th>
                <th className="border border-gray-400 p-3 text-right font-bold">إجمالي المستحق</th>
                <th className="border border-gray-400 p-3 text-right font-bold">المدفوع</th>
                <th className="border border-gray-400 p-3 text-right font-bold">المتبقي</th>
              </tr>
            </thead>
            <tbody>
              {guardianData.students.map(student => {
                const studentInvoices = guardianInvoices.filter(inv => inv.studentId === student.id);
                const stTotal = studentInvoices.reduce((sum, inv) => sum + inv.amount, 0);
                const stPaid = studentInvoices.reduce((sum, inv) => sum + inv.paid, 0);
                const stDue = stTotal - stPaid;

                return (
                  <tr key={student.id}>
                    <td className="border border-gray-400 p-3 font-bold">{student.name}</td>
                    <td className="border border-gray-400 p-3 tabular-nums">{stTotal.toLocaleString()} {currency}</td>
                    <td className="border border-gray-400 p-3 tabular-nums text-green-700">{stPaid.toLocaleString()} {currency}</td>
                    <td className="border border-gray-400 p-3 tabular-nums text-red-700 font-bold">{stDue.toLocaleString()} {currency}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-black text-base">
                <td className="border border-gray-400 p-3 text-left">الإجمالي الكلي:</td>
                <td className="border border-gray-400 p-3 tabular-nums">{totalAmount.toLocaleString()} {currency}</td>
                <td className="border border-gray-400 p-3 tabular-nums text-green-700">{totalPaid.toLocaleString()} {currency}</td>
                <td className="border border-gray-400 p-3 tabular-nums text-red-700">{totalDue.toLocaleString()} {currency}</td>
              </tr>
            </tfoot>
          </table>

          <div className="text-center mt-12 text-sm font-bold text-gray-500">
            <p>تم إصدار هذا الكشف آلياً من النظام المالي للمدرسة.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <AppShell 
      breadcrumb={[
        { label: "الرئيسية", to: "/" }, 
        { label: "أولياء الأمور", to: "/guardians" },
        { label: guardianData.name }
      ]}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <Printer className="h-4 w-4" /> خيارات الطباعة
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Header Profile */}
        <div className="relative rounded-3xl overflow-hidden bg-card border border-border/50 shadow-sm glass">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent"></div>
          <div className="relative p-6 pt-12 sm:p-10 sm:pt-16 flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="h-28 w-28 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center text-5xl font-extrabold shadow-xl border-4 border-background z-10 shrink-0">
              <User className="h-12 w-12" />
            </div>
            <div className="flex-1 text-center sm:text-right pb-2">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 mb-3">
                <h1 className="text-3xl font-extrabold">{guardianData.name}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                  {guardianData.relation}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground font-bold">
                <span className="flex items-center gap-1.5 bg-background/50 px-3 py-1 rounded-lg border border-border/50"><Phone className="h-4 w-4 text-primary" /> {guardianData.phone}</span>
                <span className="flex items-center gap-1.5 bg-background/50 px-3 py-1 rounded-lg border border-border/50"><MapPin className="h-4 w-4 text-primary" /> {guardianData.address}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Left Sidebar */}
          <div className="space-y-6">
            <PageCard title="الأبناء المرتبطون" className="shadow-sm">
              <div className="space-y-3">
                {guardianData.students.map(student => (
                  <Link 
                    key={student.id} 
                    to="/students/$id" params={{ id: student.id }}
                    className="flex flex-col p-3 rounded-2xl border border-border/50 bg-background hover:border-primary/30 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                        {student.name.split(' ')[0][0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{student.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <GraduationCap className="h-3 w-3" /> {student.grade} - الشعبة: {student.sectionId}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 border-t border-border/50 pt-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${student.status === 'نشط' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {student.status || 'نشط'}
                      </span>
                      <span className="text-xs font-bold text-primary group-hover:underline">
                        عرض الملف <ArrowLeft className="w-3 h-3 inline ml-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </PageCard>
          </div>

          {/* Right Content */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Tabs Header */}
            <div className="flex gap-2 border-b border-border/50 overflow-x-auto pb-1 mb-4">
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`px-4 py-2 font-bold text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
              >
                النظرة العامة
              </button>
              <button 
                onClick={() => setActiveTab('financial')} 
                className={`px-4 py-2 font-bold text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === 'financial' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
              >
                الملف المالي المجمع
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <PageCard title="المستحقات العاجلة" className="shadow-sm">
                  <div className="space-y-3">
                    {guardianInvoices.filter(inv => inv.status !== "paid" && inv.status !== "cancelled").length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground font-bold border border-dashed border-border/50 rounded-2xl bg-muted/5">لا توجد مستحقات مالية عاجلة. جميع حسابات الأبناء مسددة.</div>
                    ) : (
                      guardianInvoices.filter(inv => inv.status !== "paid" && inv.status !== "cancelled").slice(0, 3).map(inv => {
                        const student = guardianData.students.find(s => s.id === inv.studentId);
                        return (
                          <div key={inv.id} className="p-4 rounded-2xl border border-warning/30 bg-warning/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-warning/20 text-warning-foreground rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
                              <div>
                                <p className="font-bold text-sm">مستحقات متأخرة: {inv.title || "الرسوم الدراسية"}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">للطالب: <span className="font-bold">{student?.name}</span></p>
                              </div>
                            </div>
                            <div className="text-left flex flex-col items-end gap-2">
                              <p className="font-black text-danger tabular-nums">{(inv.amount - inv.paid).toLocaleString()} {currency}</p>
                              <button 
                                onClick={() => {
                                  setPaymentData({ invoiceId: inv.id, amount: inv.amount - inv.paid, method: "card" });
                                  setIsPaymentOpen(true);
                                }}
                                className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-success text-white px-3 text-xs font-bold hover:bg-success/90 transition-colors shadow-sm"
                              >
                                سداد
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </PageCard>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col justify-center p-4 bg-background rounded-2xl border border-border/50 shadow-sm">
                    <span className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> إجمالي المستحق
                    </span>
                    <span className="font-black text-xl tabular-nums">{totalAmount.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex flex-col justify-center p-4 bg-success/10 rounded-2xl border border-success/20 shadow-sm">
                    <span className="text-sm font-bold text-success mb-2 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> إجمالي المدفوع
                    </span>
                    <span className="font-black text-xl tabular-nums text-success">{totalPaid.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex flex-col justify-center p-4 bg-danger/10 rounded-2xl border border-danger/20 shadow-sm">
                    <span className="text-sm font-bold text-danger mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> إجمالي المتبقي
                    </span>
                    <span className="font-black text-xl tabular-nums text-danger">{totalDue.toLocaleString()} {currency}</span>
                  </div>
                </div>

                <PageCard title="جميع الفواتير والمستحقات" className="shadow-sm">
                  <div className="space-y-3">
                    {guardianInvoices.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground font-bold border border-dashed border-border/50 rounded-2xl">لا توجد فواتير مسجلة لأبناء هذا الولي.</div>
                    ) : (
                      guardianInvoices.map(inv => {
                        const student = guardianData.students.find(s => s.id === inv.studentId);
                        return (
                          <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/50 bg-background gap-4 hover:border-primary/30 transition-colors">
                            <div>
                              <p className="font-bold text-sm">{inv.title || "الرسوم الدراسية"}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                للطالب: <span className="font-bold">{student?.name}</span> • 
                                تاريخ الاستحقاق: <span className="tabular-nums font-bold">{inv.dueDate}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-left">
                                <p className="font-black tabular-nums">{inv.amount.toLocaleString()} {currency}</p>
                                <p className={`text-xs font-bold mt-1 ${inv.status === "paid" ? "text-success" : inv.status === "partial" ? "text-warning" : "text-danger"}`}>
                                  {inv.status === "paid" ? "مدفوعة بالكامل" : inv.status === "partial" ? `مدفوعة جزئياً (متبقي ${(inv.amount - inv.paid).toLocaleString()})` : "غير مدفوعة"}
                                </p>
                              </div>
                              {inv.status !== "paid" && inv.status !== "cancelled" && (
                                <button 
                                  onClick={() => {
                                    setPaymentData({ invoiceId: inv.id, amount: inv.amount - inv.paid, method: "card" });
                                    setIsPaymentOpen(true);
                                  }}
                                  className="inline-flex h-9 items-center justify-center rounded-xl bg-success/10 text-success px-4 text-sm font-bold hover:bg-success/20 transition-colors border border-success/20"
                                >
                                  سداد
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </PageCard>

                <PageCard title="سجل الحركات المالي (Timeline)" className="shadow-sm">
                  {guardianTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground font-bold border border-dashed border-border/50 rounded-2xl">لا توجد حركات مالية مسجلة.</div>
                  ) : (
                    <div className="p-2">
                      <FinancialTimeline transactions={guardianTransactions} />
                    </div>
                  )}
                </PageCard>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Make Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-success/5">
              <h2 className="text-xl font-bold flex items-center gap-2 text-success"><CreditCard className="h-5 w-5" /> سداد فاتورة ولي الأمر</h2>
              <button onClick={() => setIsPaymentOpen(false)} className="p-2 hover:bg-accent rounded-full transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              addPayment({ invoiceId: paymentData.invoiceId, amount: paymentData.amount, method: paymentData.method as any, date: new Date().toISOString() });
              toast.success("تم تسجيل الدفعة بنجاح");
              setIsPaymentOpen(false);
            }} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">المبلغ المحصل (ر.س)</label>
                <input required type="number" min="1" value={paymentData.amount || ""} onChange={e => setPaymentData({...paymentData, amount: Number(e.target.value)})} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-success focus:outline-none focus:ring-1 focus:ring-success transition-colors tabular-nums font-black text-xl text-success" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">طريقة الدفع</label>
                <select required value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value as any})} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-success focus:outline-none focus:ring-1 focus:ring-success transition-colors font-bold">
                  <option value="cash">نقدي (كاش)</option>
                  <option value="card">شبكة (مدى/بطاقة ائتمانية)</option>
                  <option value="bank_transfer">حوالة بنكية</option>
                  <option value="cheque">شيك</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsPaymentOpen(false)} className="rounded-xl px-6 py-2.5 font-bold hover:bg-accent transition-colors border border-border">إلغاء</button>
                <button type="submit" className="rounded-xl bg-success px-8 py-2.5 font-bold text-white hover:bg-success/90 transition-colors shadow-md">تأكيد السداد</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`ملف ولي الأمر: ${guardianData.name}`}
        data={[]}
        templates={printTemplates}
      />
    </AppShell>
  );
}
