import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { 
  Save, Upload, Languages, Palette, BellRing, School as SchoolIcon,
  Calendar, DollarSign, Users, UserPlus, ShieldCheck, HardDrive, 
  Link as LinkIcon, Lock, Database, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Settings
} from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات الشاملة | منصة مدارس" }] }),
  component: SettingsPage,
});

const TABS = [
  { id: "school", label: "بيانات المدرسة", icon: SchoolIcon },
  { id: "academic", label: "السنوات الأكاديمية", icon: Calendar },
  { id: "finance", label: "الإعدادات المالية", icon: DollarSign },
  { id: "hr", label: "الموارد البشرية", icon: Users },
  { id: "admission", label: "القبول والتسجيل", icon: UserPlus },
  { id: "brand", label: "الهوية البصرية", icon: Palette },
  { id: "theme", label: "الثيم والتخصيص", icon: Palette },
  { id: "lang", label: "اللغة والاتجاه", icon: Languages },
  { id: "notif", label: "إعدادات الإشعارات", icon: BellRing },
  { id: "roles", label: "صلاحيات افتراضية", icon: ShieldCheck },
  { id: "backup", label: "النسخ الاحتياطي", icon: HardDrive },
  { id: "integrations", label: "تطبيقات الطرف الثالث", icon: LinkIcon },
  { id: "security", label: "الأمان والدخول", icon: Lock },
  { id: "data_io", label: "الاستيراد والتصدير (ذكي)", icon: Database },
] as const;

function SettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("school");
  const { currency, setCurrency, allAcademicYears } = useGlobalStore();

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "إعدادات النظام الشاملة" }]}>
      <div className="flex items-center gap-4 border-b border-border pb-4 mb-6">
        <div className="bg-primary/10 text-primary p-3 rounded-xl">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black">إعدادات النظام المركزية</h1>
          <p className="text-sm font-bold text-muted-foreground mt-1">التحكم بكافة إعدادات المنصة، السياسات، والتقاطعات</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
        <nav className="space-y-1 rounded-xl border border-border bg-card p-3 shadow-sm sticky top-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
                  active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {tab === "school" && (
            <PageCard title="البيانات الأساسية للمدرسة">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="اسم المدرسة الرسمي"><input defaultValue="مدرسة النموذج الأهلية" className={inp} /></Field>
                <Field label="رقم الترخيص الوزاري"><input defaultValue="LIC-2024-001" className={inp} /></Field>
                <Field label="الهاتف الثابت"><input defaultValue="0112345678" className={inp} /></Field>
                <Field label="البريد الإلكتروني الرسمي"><input type="email" defaultValue="info@school.edu" className={inp} /></Field>
                <Field label="المدينة / المنطقة"><input defaultValue="الرياض - حي الواحة" className={inp} /></Field>
                <Field label="المدير العام المعتمد"><input defaultValue="خالد القحطاني" className={inp} /></Field>
                <div className="md:col-span-2">
                  <Field label="الرؤية والرسالة (تظهر في التقارير)"><textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" rows={3} defaultValue="الريادة في التعليم وصناعة جيل واعٍ مبتكر"></textarea></Field>
                </div>
              </div>
            </PageCard>
          )}

          {tab === "academic" && (
            <PageCard title="السنوات والتقويم الأكاديمي">
              <div className="space-y-4">
                 <Field label="السنة الأكاديمية الحالية (الافتراضية)">
                    <select className={inp}>
                      {allAcademicYears.map(y => (
                        <option key={y.id} value={y.id}>{y.name} {y.isCurrent ? '(الحالية)' : ''}</option>
                      ))}
                    </select>
                 </Field>
                 <div className="grid gap-4 md:grid-cols-2">
                    <Field label="بداية الدوام الشتوي"><input type="time" defaultValue="07:30" className={inp} /></Field>
                    <Field label="بداية الدوام الصيفي"><input type="time" defaultValue="06:45" className={inp} /></Field>
                 </div>
                 <div className="border-t border-border pt-4 mt-4">
                    <h3 className="font-bold text-sm mb-3">حساب الغياب والتأخير</h3>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> احتساب التأخير عن الطابور كغياب جزئي</label>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> خصم درجات السلوك تلقائياً عند تجاوز الغياب 10 أيام</label>
                    </div>
                 </div>
              </div>
            </PageCard>
          )}

          {tab === "finance" && (
            <PageCard title="إعدادات النظام المالي">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="العملة الرسمية للنظام">
                  <input 
                    value={currency} 
                    onChange={e => setCurrency(e.target.value)} 
                    placeholder="مثال: ر.س أو دولار"
                    className={inp} 
                  />
                </Field>
                <Field label="الرقم الضريبي (VAT)"><input defaultValue="300012345600003" className={inp} /></Field>
                <Field label="نسبة ضريبة القيمة المضافة (%)"><input type="number" defaultValue="15" className={inp} /></Field>
                <Field label="سياسة الاسترداد">
                  <select className={inp}>
                    <option>خلال 14 يوم من التسجيل</option>
                    <option>قبل بداية الفصل فقط</option>
                    <option>لا يوجد استرداد نقدي</option>
                  </select>
                </Field>
                <div className="md:col-span-2 border-t border-border pt-4 mt-2">
                   <h3 className="font-bold text-sm mb-3">أتمتة العمليات المالية</h3>
                   <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> ترحيل الرواتب آلياً لقسم المصروفات عند اعتماد المسير</label>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> إنشاء مصروف آلياً عند إكمال صيانة مرفق (متصل بقسم المرافق)</label>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> إضافة رسوم تلقائية عند استعارة كتاب متأخر (متصل بالمكتبة)</label>
                   </div>
                </div>
              </div>
            </PageCard>
          )}

          {tab === "hr" && (
            <PageCard title="سياسات الموارد البشرية">
               <div className="grid gap-4 md:grid-cols-2">
                  <Field label="عدد أيام الإجازة السنوية الافتراضية"><input type="number" defaultValue="30" className={inp} /></Field>
                  <Field label="نسبة خصم التأخير اليومي (%)"><input type="number" defaultValue="2" className={inp} /></Field>
                  <div className="md:col-span-2">
                     <h3 className="font-bold text-sm mb-3 mt-2">قواعد الحضور والانصراف</h3>
                     <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> السماح بفترة سماح 15 دقيقة للتأخير الصباحي</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> ربط جهاز البصمة مباشرة بمسير الرواتب</label>
                     </div>
                  </div>
               </div>
            </PageCard>
          )}

          {tab === "admission" && (
            <PageCard title="سياسات القبول والتسجيل">
               <div className="grid gap-4">
                  <Field label="حالة القبول الحالية">
                    <select className={inp}>
                      <option>مفتوح للتسجيل الإلكتروني</option>
                      <option>مغلق (الوصول للسعة القصوى)</option>
                      <option>مفتوح لقائمة الانتظار فقط</option>
                    </select>
                  </Field>
                  <Field label="الحد الأقصى للطلاب في الفصل"><input type="number" defaultValue="25" className={inp} /></Field>
                  <h3 className="font-bold text-sm mb-2 mt-2">الأوراق المطلوبة للقبول</h3>
                  <div className="flex flex-col gap-2 p-3 border border-border rounded-lg bg-card">
                     <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> شهادة الميلاد الأصلية</label>
                     <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> سجل التطعيمات الطبي</label>
                     <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> شهادة النجاح من المدرسة السابقة</label>
                     <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> كرت العائلة للمطابقة</label>
                  </div>
               </div>
            </PageCard>
          )}

          {tab === "brand" && (
            <PageCard title="الهوية البصرية والمطبوعات">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-bold text-muted-foreground mb-2">الشعار الرسمي (اللوغو)</div>
                  <div className="grid h-32 place-items-center rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-primary">
                    <div className="flex flex-col items-center gap-2">
                       <Upload className="h-6 w-6" />
                       <span className="text-sm font-bold">رفع صورة الشعار</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground mb-2">الختم المعتمد (للشهادات والفواتير)</div>
                  <div className="grid h-32 place-items-center rounded-lg border-2 border-dashed border-border bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                       <Upload className="h-6 w-6" />
                       <span className="text-sm font-bold">رفع صورة الختم</span>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 mt-4">
                  <Field label="تذييل المطبوعات الافتراضي"><textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" rows={2} defaultValue="هذه الوثيقة معتمدة ومستخرجة من نظام مدارس الإلكتروني"></textarea></Field>
                </div>
              </div>
            </PageCard>
          )}

          {tab === "theme" && (
            <PageCard title="تخصيص الواجهة والثيم">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-sm mb-3">وضع الألوان المفضل</h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    {["فاتح", "داكن", "حسب النظام المتزامن"].map((m, i) => (
                      <label key={m} className={`cursor-pointer rounded-lg border p-4 text-sm font-bold flex items-center gap-3 transition-colors ${i === 0 ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                        <input type="radio" name="theme" defaultChecked={i === 0} className="h-4 w-4" />
                        {m}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-3">تنسيق الجداول</h3>
                  <select className={inp}>
                    <option>كثافة عادية (مريح)</option>
                    <option>كثافة عالية (بيانات أكثر)</option>
                  </select>
                </div>
              </div>
            </PageCard>
          )}

          {tab === "lang" && (
            <PageCard title="اللغة والاتجاه">
              <Field label="لغة واجهة النظام الرئيسية">
                <select className={inp}>
                  <option>العربية (RTL)</option>
                  <option>English (LTR)</option>
                  <option>Français (LTR)</option>
                </select>
              </Field>
              <div className="mt-4 p-3 bg-muted rounded-lg text-xs font-bold text-muted-foreground border border-border">
                يتم تطبيق اتجاه الواجهة (يمين لليسار أو يسار لليمين) تلقائياً بناءً على اختيار اللغة. النظام حالياً مُهيأ لدعم اللغات المتعددة (i18n).
              </div>
            </PageCard>
          )}

          {tab === "notif" && (
            <PageCard title="قواعد الإشعارات والرسائل">
               <h3 className="font-bold text-sm mb-4">التنبيهات التلقائية للنظام</h3>
               <ul className="space-y-3">
                {[
                  { l: "إرسال رسالة SMS لولي الأمر فور تسجيل الغياب", on: true },
                  { l: "إشعار المدير بطلبات الصيانة العاجلة عبر النظام", on: true },
                  { l: "إرسال فاتورة إلكترونية عند إصدار مطالبة مالية", on: true },
                  { l: "تنبيه المعلمين بمواعيد تسليم النتائج", on: false },
                  { l: "إشعار الطلاب بإصدار الكتب في المكتبة", on: true },
                ].map((it) => (
                  <li key={it.l} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                    <span className="text-sm font-bold">{it.l}</span>
                    <input type="checkbox" defaultChecked={it.on} className="h-5 w-5" />
                  </li>
                ))}
              </ul>
            </PageCard>
          )}

          {tab === "roles" && (
             <PageCard title="إعدادات الأدوار الافتراضية">
                <div className="space-y-4">
                   <Field label="الصلاحية الافتراضية للموظف الجديد">
                     <select className={inp}>
                       <option>معلم (صلاحيات محدودة)</option>
                       <option>إداري (بدون مالية)</option>
                       <option>موظف استقبال</option>
                     </select>
                   </Field>
                   <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <h3 className="font-bold text-sm mb-2 text-primary">إدارة الصلاحيات المتقدمة</h3>
                      <p className="text-xs text-muted-foreground mb-4">يتم تخصيص الصلاحيات الدقيقة لكل دور (قراءة، كتابة، حذف، اعتماد مالي) من خلال قسم الإدارة العامة.</p>
                      <button className="text-xs font-bold text-primary underline underline-offset-4">الانتقال لمدير الصلاحيات</button>
                   </div>
                </div>
             </PageCard>
          )}

          {tab === "backup" && (
             <PageCard title="جدولة النسخ الاحتياطي">
                <div className="grid gap-4 md:grid-cols-2">
                   <Field label="تكرار النسخ الاحتياطي التلقائي">
                     <select className={inp}>
                       <option>يومياً (الساعة 2:00 صباحاً)</option>
                       <option>أسبوعياً (نهاية الأسبوع)</option>
                       <option>كل 12 ساعة</option>
                     </select>
                   </Field>
                   <Field label="الاحتفاظ بالنسخ لمدة">
                     <select className={inp}>
                       <option>30 يوماً</option>
                       <option>60 يوماً</option>
                       <option>دائماً (لا تحذف)</option>
                     </select>
                   </Field>
                   <div className="md:col-span-2 mt-2">
                      <h3 className="font-bold text-sm mb-3">خيارات التخزين</h3>
                      <div className="flex flex-col gap-3">
                         <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> التخزين على خوادم المدرسة (Local)</label>
                         <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" /> المزامنة مع Amazon S3</label>
                         <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> المزامنة مع Google Drive</label>
                      </div>
                   </div>
                </div>
             </PageCard>
          )}

          {tab === "integrations" && (
             <PageCard title="تطبيقات الطرف الثالث (Integrations)">
                <div className="space-y-4">
                   <div className="p-4 border border-border rounded-xl flex items-center justify-between">
                      <div>
                         <h4 className="font-bold">منصة نور (نظام التعليم المركزي)</h4>
                         <p className="text-xs text-muted-foreground mt-1">مزامنة الطلاب، الغياب، والدرجات تلقائياً.</p>
                      </div>
                      <span className="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-lg">متصل ومفعل</span>
                   </div>
                   <div className="p-4 border border-border rounded-xl flex items-center justify-between">
                      <div>
                         <h4 className="font-bold">بوابة الدفع (PayTabs / Stripe)</h4>
                         <p className="text-xs text-muted-foreground mt-1">استقبال الرسوم الدراسية إلكترونياً وتحديث الفواتير آلياً.</p>
                      </div>
                      <button className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90">تكوين الربط</button>
                   </div>
                   <div className="p-4 border border-border rounded-xl flex items-center justify-between">
                      <div>
                         <h4 className="font-bold">مزود رسائل SMS (Twilio / Unifonic)</h4>
                         <p className="text-xs text-muted-foreground mt-1">لإرسال إشعارات الغياب والمطالبات المالية.</p>
                      </div>
                      <button className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90">تكوين الربط</button>
                   </div>
                </div>
             </PageCard>
          )}

          {tab === "security" && (
             <PageCard title="الأمان والتحكم بالدخول">
                <div className="grid gap-4 md:grid-cols-2">
                   <Field label="سياسة كلمة المرور">
                     <select className={inp}>
                       <option>معقدة (حروف، أرقام، رموز)</option>
                       <option>متوسطة (حروف وأرقام)</option>
                       <option>بسيطة (أرقام فقط - غير مستحسن)</option>
                     </select>
                   </Field>
                   <Field label="مهلة الخروج التلقائي (Session Timeout)">
                     <select className={inp}>
                       <option>بعد 30 دقيقة من الخمول</option>
                       <option>بعد ساعة</option>
                       <option>لا تسجل خروج</option>
                     </select>
                   </Field>
                   <div className="md:col-span-2 mt-2">
                      <div className="flex flex-col gap-3">
                         <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> فرض التحقق بخطوتين (2FA) للإداريين والمعلمين</label>
                         <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="h-4 w-4" /> حظر حساب المستخدم مؤقتاً بعد 5 محاولات دخول فاشلة</label>
                      </div>
                   </div>
                </div>
             </PageCard>
          )}

          {tab === "data_io" && (
            <PageCard title="المستورد والمُصدّر الذكي (Smart Importers)">
              <div className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4 items-start">
                   <div className="bg-primary/20 p-2 rounded-lg text-primary"><Database className="h-5 w-5" /></div>
                   <div>
                     <h3 className="font-bold text-primary">محرك البيانات المركزي</h3>
                     <p className="text-sm text-muted-foreground mt-1">يتيح لك المحرك الذكي استيراد بيانات نظام "نور" أو غيره تلقائياً، والتعرف على الأعمدة وتصحيح الأخطاء قبل الاعتماد.</p>
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer group">
                     <ArrowDownToLine className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                     <h4 className="font-bold text-sm">استيراد بيانات نظام "نور"</h4>
                     <p className="text-xs text-muted-foreground mt-1 mb-4">رفع ملفات Excel أو CSV لمطابقة الطلاب والمعلمين آلياً.</p>
                     <div className="flex items-center gap-2 text-xs font-bold text-primary">
                       <Upload className="h-4 w-4" /> ارفع الملف الآن
                     </div>
                  </div>
                  
                  <div className="border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer group">
                     <ArrowUpFromLine className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                     <h4 className="font-bold text-sm">النسخ الاحتياطي السحابي (تصدير)</h4>
                     <p className="text-xs text-muted-foreground mt-1 mb-4">تصدير كافة سجلات المنصة بنسق معتمد لوزارة التعليم.</p>
                     <div className="flex items-center gap-2 text-xs font-bold text-primary">
                       <CheckCircle2 className="h-4 w-4" /> بدء عملية التصدير
                     </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="font-bold text-sm mb-3">سجل عمليات المزامنة الأخيرة</h4>
                  <div className="text-sm border border-border rounded-lg divide-y divide-border">
                     <div className="p-3 flex justify-between items-center bg-muted/30">
                       <span className="font-bold">استيراد دفعة طلاب (نور)</span>
                       <span className="text-success text-xs font-bold">مكتمل (450 سجل)</span>
                     </div>
                     <div className="p-3 flex justify-between items-center bg-muted/30">
                       <span className="font-bold">مزامنة الرواتب (نظام فارس)</span>
                       <span className="text-muted-foreground text-xs font-bold">منذ 3 أيام</span>
                     </div>
                  </div>
                </div>
              </div>
            </PageCard>
          )}

           <div className="flex justify-end mt-8 sticky bottom-4">
             <div className="bg-card/80 backdrop-blur border border-border p-3 rounded-xl shadow-lg flex items-center gap-4 w-full">
                <span className="text-xs text-muted-foreground font-bold hidden sm:inline-block">تأكد من مراجعة الإعدادات قبل الحفظ</span>
                <button onClick={() => toast.success("تم حفظ التعديلات المركزية بنجاح")}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-sm mr-auto">
                  <Save className="h-4 w-4" /> حفظ كافة الإعدادات
                </button>
             </div>
           </div>
        </div>
      </div>
    </AppShell>
  );
}

function SettingsIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
}

const inp = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
