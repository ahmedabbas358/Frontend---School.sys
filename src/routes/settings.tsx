import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { 
  Save, Upload, Languages, Palette, BellRing, School as SchoolIcon,
  Calendar, DollarSign, Users, UserPlus, ShieldCheck, HardDrive, 
  Link as LinkIcon, Lock, Database, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Settings, Building,
  Smartphone, KeyRound, Webhook, Copy, RefreshCcw, FileText, QrCode
} from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات الشاملة | منصة مدارس" }] }),
  component: SettingsPage,
});

const TABS = [
  { id: "school", label: "بيانات المدرسة", icon: SchoolIcon },
  { id: "facilities", label: "المرافق والأصول", icon: Building },
  { id: "academic", label: "السنوات الأكاديمية", icon: Calendar },
  { id: "finance", label: "الإعدادات المالية", icon: DollarSign },
  { id: "hr", label: "الموارد البشرية", icon: Users },
  { id: "admission", label: "القبول والتسجيل", icon: UserPlus },
  { id: "brand", label: "الهوية البصرية", icon: Palette },
  { id: "print", label: "قوالب الطباعة", icon: FileText },
  { id: "theme", label: "الثيم والتخصيص", icon: Palette },
  { id: "lang", label: "اللغة والاتجاه", icon: Languages },
  { id: "notif", label: "إعدادات الإشعارات", icon: BellRing },
  { id: "roles", label: "صلاحيات افتراضية", icon: ShieldCheck },
  { id: "backup", label: "النسخ الاحتياطي", icon: HardDrive },
  { id: "integrations", label: "تطبيقات الطرف الثالث", icon: LinkIcon },
  { id: "mobile", label: "تطبيق الهاتف", icon: Smartphone },
  { id: "api", label: "API والربط المتقدم", icon: KeyRound },
  { id: "security", label: "الأمان والدخول", icon: Lock },
  { id: "data_io", label: "الاستيراد والتصدير (ذكي)", icon: Database },
] as const;

function SettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("school");
  const [apiKey, setApiKey] = useState("sk_live_school_••••_7F3A9C");
  const { currency, setCurrency, allAcademicYears, systemSettings, updateSettings } = useGlobalStore();

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
          
          {tab === "facilities" && (
            <PageCard title="إعدادات المرافق والأصول">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="تصنيفات القاعات (مفصولة بفاصلة)">
                    <input type="text" className={inp} value={systemSettings.roomCategories} onChange={e => updateSettings({roomCategories: e.target.value})} />
                  </Field>
                  <Field label="تصنيفات الأصول (مفصولة بفاصلة)">
                    <input type="text" className={inp} value={systemSettings.assetCategories} onChange={e => updateSettings({assetCategories: e.target.value})} />
                  </Field>
                  <Field label="نظام ترقيم القاعات">
                    <select className={inp} value={systemSettings.roomNumbering} onChange={e => updateSettings({roomNumbering: e.target.value})}>
                      <option>ترقيم تلقائي (RM-XXXX)</option>
                      <option>ترقيم يدوي مخصص</option>
                    </select>
                  </Field>
                  <Field label="تنبيهات الصيانة المبكرة">
                    <select className={inp} value={systemSettings.maintenanceAlert} onChange={e => updateSettings({maintenanceAlert: e.target.value})}>
                      <option>مفعل (قبل 7 أيام)</option>
                      <option>مفعل (قبل 3 أيام)</option>
                      <option>معطل</option>
                    </select>
                  </Field>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                   <h3 className="font-bold text-sm mb-2 text-primary">إعدادات المستودع</h3>
                   <div className="grid gap-4 md:grid-cols-2 mt-4">
                     <Field label="حد التنبيه للمخزون المنخفض">
                        <input type="number" className={inp} value={systemSettings.inventoryAlertLimit} onChange={e => updateSettings({inventoryAlertLimit: parseInt(e.target.value) || 0})} />
                     </Field>
                     <Field label="طريقة جرد المخزون">
                       <select className={inp} value={systemSettings.inventoryMethod} onChange={e => updateSettings({inventoryMethod: e.target.value})}>
                         <option>FIFO (ما يدخل أولاً يخرج أولاً)</option>
                         <option>LIFO (ما يدخل آخراً يخرج أولاً)</option>
                       </select>
                     </Field>
                   </div>
                </div>
              </div>
            </PageCard>
          )}

          {tab === "school" && (
            <PageCard title="البيانات الأساسية للمدرسة">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="اسم المدرسة الرسمي"><input value={systemSettings.schoolName} onChange={e => updateSettings({schoolName: e.target.value})} className={inp} /></Field>
                <Field label="رقم الترخيص الوزاري"><input value={systemSettings.licenseNumber} onChange={e => updateSettings({licenseNumber: e.target.value})} className={inp} /></Field>
                <Field label="الهاتف الثابت"><input value={systemSettings.phone} onChange={e => updateSettings({phone: e.target.value})} className={inp} /></Field>
                <Field label="البريد الإلكتروني الرسمي"><input type="email" value={systemSettings.email} onChange={e => updateSettings({email: e.target.value})} className={inp} /></Field>
                <Field label="المدينة / المنطقة"><input value={systemSettings.address} onChange={e => updateSettings({address: e.target.value})} className={inp} /></Field>
                <Field label="المدير العام المعتمد"><input value={systemSettings.principalName} onChange={e => updateSettings({principalName: e.target.value})} className={inp} /></Field>
                <div className="md:col-span-2">
                  <Field label="الرؤية والرسالة (تظهر في التقارير)"><textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" rows={3} value={systemSettings.vision} onChange={e => updateSettings({vision: e.target.value})}></textarea></Field>
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
                    <Field label="بداية الدوام الشتوي"><input type="time" value={systemSettings.winterTime} onChange={e => updateSettings({winterTime: e.target.value})} className={inp} /></Field>
                    <Field label="بداية الدوام الصيفي"><input type="time" value={systemSettings.summerTime} onChange={e => updateSettings({summerTime: e.target.value})} className={inp} /></Field>
                 </div>
                 <div className="border-t border-border pt-4 mt-4">
                    <h3 className="font-bold text-sm mb-3">حساب الغياب والتأخير</h3>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.lateAsPartialAbsence} onChange={e => updateSettings({lateAsPartialAbsence: e.target.checked})} className="h-4 w-4" /> احتساب التأخير عن الطابور كغياب جزئي</label>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.deductBehaviorOnAbsence} onChange={e => updateSettings({deductBehaviorOnAbsence: e.target.checked})} className="h-4 w-4" /> خصم درجات السلوك تلقائياً عند تجاوز الغياب 10 أيام</label>
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
                    placeholder="مثال: ج.س"
                    className={inp} 
                  />
                </Field>
                <Field label="الرقم الضريبي (VAT)"><input value={systemSettings.taxNumber} onChange={e => updateSettings({taxNumber: e.target.value})} className={inp} /></Field>
                <Field label="نسبة ضريبة القيمة المضافة (%)"><input type="number" value={systemSettings.vatRate} onChange={e => updateSettings({vatRate: parseInt(e.target.value) || 0})} className={inp} /></Field>
                <Field label="سياسة الاسترداد">
                  <select className={inp} value={systemSettings.refundPolicy} onChange={e => updateSettings({refundPolicy: e.target.value})}>
                    <option>خلال 14 يوم من التسجيل</option>
                    <option>قبل بداية الفصل فقط</option>
                    <option>لا يوجد استرداد نقدي</option>
                  </select>
                </Field>
                <div className="md:col-span-2 border-t border-border pt-4 mt-2">
                   <h3 className="font-bold text-sm mb-3">أتمتة العمليات المالية</h3>
                   <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.autoTransferPayroll} onChange={e => updateSettings({autoTransferPayroll: e.target.checked})} className="h-4 w-4" /> ترحيل الرواتب آلياً لقسم المصروفات عند اعتماد المسير</label>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.autoMaintenanceExpense} onChange={e => updateSettings({autoMaintenanceExpense: e.target.checked})} className="h-4 w-4" /> إنشاء مصروف آلياً عند إكمال صيانة مرفق (متصل بقسم المرافق)</label>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.autoLibraryFee} onChange={e => updateSettings({autoLibraryFee: e.target.checked})} className="h-4 w-4" /> إضافة رسوم تلقائية عند استعارة كتاب متأخر (متصل بالمكتبة)</label>
                   </div>
                </div>
              </div>
            </PageCard>
          )}

          {tab === "hr" && (
            <PageCard title="سياسات الموارد البشرية">
               <div className="grid gap-4 md:grid-cols-2">
                  <Field label="عدد أيام الإجازة السنوية الافتراضية"><input type="number" value={systemSettings.annualLeaveDays} onChange={e => updateSettings({annualLeaveDays: parseInt(e.target.value) || 0})} className={inp} /></Field>
                  <Field label="نسبة خصم التأخير اليومي (%)"><input type="number" value={systemSettings.lateDeductionRate} onChange={e => updateSettings({lateDeductionRate: parseInt(e.target.value) || 0})} className={inp} /></Field>
                  <div className="md:col-span-2">
                     <h3 className="font-bold text-sm mb-3 mt-2">قواعد الحضور والانصراف</h3>
                     <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.gracePeriod} onChange={e => updateSettings({gracePeriod: e.target.checked})} className="h-4 w-4" /> السماح بفترة سماح 15 دقيقة للتأخير الصباحي</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.fingerprintSync} onChange={e => updateSettings({fingerprintSync: e.target.checked})} className="h-4 w-4" /> ربط جهاز البصمة مباشرة بمسير الرواتب</label>
                     </div>
                  </div>
               </div>
            </PageCard>
          )}

          {tab === "admission" && (
            <PageCard title="سياسات القبول والتسجيل">
               <div className="grid gap-4">
                  <Field label="حالة القبول الحالية">
                    <select className={inp} value={systemSettings.admissionStatus} onChange={e => updateSettings({admissionStatus: e.target.value})}>
                      <option>مفتوح للتسجيل الإلكتروني</option>
                      <option>مغلق (الوصول للسعة القصوى)</option>
                      <option>مفتوح لقائمة الانتظار فقط</option>
                    </select>
                  </Field>
                  <Field label="الحد الأقصى للطلاب في الفصل"><input type="number" value={systemSettings.maxClassSize} onChange={e => updateSettings({maxClassSize: parseInt(e.target.value) || 0})} className={inp} /></Field>
                  <h3 className="font-bold text-sm mb-2 mt-2">الأوراق المطلوبة للقبول</h3>
                  <div className="flex flex-col gap-2 p-3 border border-border rounded-lg bg-card">
                     <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.reqBirthCert} onChange={e => updateSettings({reqBirthCert: e.target.checked})} className="h-4 w-4" /> شهادة الميلاد الأصلية</label>
                     <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.reqVaccine} onChange={e => updateSettings({reqVaccine: e.target.checked})} className="h-4 w-4" /> سجل التطعيمات الطبي</label>
                     <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.reqPrevCert} onChange={e => updateSettings({reqPrevCert: e.target.checked})} className="h-4 w-4" /> شهادة النجاح من المدرسة السابقة</label>
                     <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.reqFamilyCard} onChange={e => updateSettings({reqFamilyCard: e.target.checked})} className="h-4 w-4" /> كرت العائلة للمطابقة</label>
                  </div>
               </div>
            </PageCard>
          )}

          {tab === "brand" && (
            <PageCard title="الهوية البصرية والمطبوعات">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-bold text-muted-foreground mb-2">الشعار الرسمي (اللوغو)</div>
                  <label className="grid h-32 place-items-center rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer text-primary">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.length) toast.success("تم رفع صورة الشعار بنجاح") }} />
                    <div className="flex flex-col items-center gap-2">
                       <Upload className="h-6 w-6" />
                       <span className="text-sm font-bold">رفع صورة الشعار</span>
                    </div>
                  </label>
                </div>
                <div>
                  <div className="text-xs font-bold text-muted-foreground mb-2">الختم المعتمد (للشهادات والفواتير)</div>
                  <label className="grid h-32 place-items-center rounded-lg border-2 border-dashed border-border bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer text-muted-foreground">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.length) toast.success("تم رفع صورة الختم بنجاح") }} />
                    <div className="flex flex-col items-center gap-2">
                       <Upload className="h-6 w-6" />
                       <span className="text-sm font-bold">رفع صورة الختم</span>
                    </div>
                  </label>
                </div>
                <div className="md:col-span-2 mt-4">
                  <Field label="تذييل المطبوعات الافتراضي"><textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" rows={2} value={systemSettings.footerText} onChange={e => updateSettings({footerText: e.target.value})}></textarea></Field>
                </div>
              </div>
            </PageCard>
          )}

          {tab === "print" && (
            <PageCard title="قوالب الطباعة والسياسات الافتراضية">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="القالب الافتراضي للكشوف الكبيرة">
                    <select className={inp} value={systemSettings.defaultTemplate} onChange={e => updateSettings({defaultTemplate: e.target.value})}>
                      <option>جدول مضغوط مع تكرار الترويسة</option>
                      <option>جدول رسمي بتوقيعات</option>
                      <option>بطاقات فردية</option>
                    </select>
                  </Field>
                  <Field label="عدد الصفوف لكل دفعة طباعة">
                    <select className={inp} value={systemSettings.rowsPerBatch} onChange={e => updateSettings({rowsPerBatch: e.target.value})}>
                      <option>60 صف</option>
                      <option>90 صف</option>
                      <option>120 صف</option>
                    </select>
                  </Field>
                  <Field label="اعتماد رمز تحقق QR">
                    <select className={inp} value={systemSettings.qrCodeUsage} onChange={e => updateSettings({qrCodeUsage: e.target.value})}>
                      <option>مفعل لكل الشهادات والفواتير</option>
                      <option>مفعل للشهادات فقط</option>
                      <option>معطل</option>
                    </select>
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-center gap-2 font-bold"><FileText className="h-4 w-4 text-primary" /> ترويسة موحدة</div>
                    <div className="space-y-3">
                      <Field label="اسم الجهة أعلى المستند"><input className={inp} value={systemSettings.headerEntity} onChange={e => updateSettings({headerEntity: e.target.value})} /></Field>
                      <Field label="اسم الإدارة التعليمية"><input className={inp} value={systemSettings.headerDepartment} onChange={e => updateSettings({headerDepartment: e.target.value})} /></Field>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-center gap-2 font-bold"><QrCode className="h-4 w-4 text-primary" /> التحقق الرقمي</div>
                    <div className="space-y-3">
                      <Field label="رابط التحقق العام"><input className={inp} dir="ltr" value={systemSettings.qrVerifyUrl} onChange={e => updateSettings({qrVerifyUrl: e.target.value})} /></Field>
                      <Field label="مدة صلاحية رابط التحقق"><select className={inp} value={systemSettings.qrExpiry} onChange={e => updateSettings({qrExpiry: e.target.value})}><option>سنة كاملة</option><option>90 يوم</option><option>دائم</option></select></Field>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.qrIncludeId} onChange={e => updateSettings({qrIncludeId: e.target.checked})} className="h-4 w-4" /> تضمين رقم الطالب/الموظف داخل رمز التحقق</label>
                    </div>
                  </div>
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
                    {[{ id: "light", label: "فاتح" }, { id: "dark", label: "داكن" }, { id: "system", label: "حسب النظام المتزامن" }].map((m, i) => (
                      <label key={m.id} className={`cursor-pointer rounded-lg border p-4 text-sm font-bold flex items-center gap-3 transition-colors ${systemSettings.themeMode === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                        <input type="radio" name="theme" checked={systemSettings.themeMode === m.id} onChange={() => updateSettings({themeMode: m.id as any})} className="h-4 w-4" />
                        {m.label}
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
                <select className={inp} value={systemSettings.language} onChange={e => updateSettings({ language: e.target.value as "ar" | "en" })}>
                  <option value="ar">العربية (RTL)</option>
                  <option value="en">English (LTR)</option>
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
                  { l: "إرسال رسالة SMS لولي الأمر فور تسجيل الغياب", field: "sms" },
                  { l: "إشعار المدير بطلبات الصيانة العاجلة عبر النظام", field: "push" },
                  { l: "إرسال فاتورة إلكترونية عند إصدار مطالبة مالية", field: "email" },
                ].map((it) => (
                  <li key={it.l} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                    <span className="text-sm font-bold">{it.l}</span>
                    <input type="checkbox" checked={systemSettings.defaultChannels[it.field as keyof typeof systemSettings.defaultChannels]} onChange={e => updateSettings({ defaultChannels: { ...systemSettings.defaultChannels, [it.field]: e.target.checked } })} className="h-5 w-5" />
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
                      <Link to="/admin/permissions" className="text-xs font-bold text-primary underline underline-offset-4">الانتقال لمدير الصلاحيات</Link>
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
                <div className="space-y-6">
                   <div className="p-4 border border-border rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                           <h4 className="font-bold">منصة نور (نظام التعليم المركزي)</h4>
                           <p className="text-xs text-muted-foreground mt-1">مزامنة الطلاب، الغياب، والدرجات تلقائياً.</p>
                        </div>
                        <span className="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-lg">متصل ومفعل</span>
                      </div>
                   </div>

                   <div className="p-4 border border-border rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                           <h4 className="font-bold">بوابة الدفع الإلكتروني</h4>
                           <p className="text-xs text-muted-foreground mt-1">استقبال الرسوم الدراسية إلكترونياً وتحديث الفواتير آلياً.</p>
                        </div>
                        <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm font-bold outline-none" value={systemSettings.paymentGateway} onChange={e => updateSettings({paymentGateway: e.target.value})}>
                          <option value="none">غير مفعل</option>
                          <option value="stripe">Stripe</option>
                          <option value="paytabs">PayTabs</option>
                        </select>
                      </div>

                      {systemSettings.paymentGateway === "stripe" && (
                        <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t border-border">
                           <Field label="Stripe Public Key"><input type="text" dir="ltr" className={inp} value={systemSettings.stripePubKey || ""} onChange={e => updateSettings({stripePubKey: e.target.value})} placeholder="pk_test_..." /></Field>
                           <Field label="Stripe Secret Key"><input type="password" dir="ltr" className={inp} value={systemSettings.stripeSecretKey || ""} onChange={e => updateSettings({stripeSecretKey: e.target.value})} placeholder="sk_test_..." /></Field>
                        </div>
                      )}

                      {systemSettings.paymentGateway === "paytabs" && (
                        <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t border-border">
                           <Field label="PayTabs Profile ID"><input type="text" dir="ltr" className={inp} value={systemSettings.paytabsProfileId || ""} onChange={e => updateSettings({paytabsProfileId: e.target.value})} placeholder="12345" /></Field>
                           <Field label="PayTabs Server Key"><input type="password" dir="ltr" className={inp} value={systemSettings.paytabsServerKey || ""} onChange={e => updateSettings({paytabsServerKey: e.target.value})} placeholder="STJ..." /></Field>
                        </div>
                      )}
                   </div>

                   <div className="p-4 border border-border rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                           <h4 className="font-bold">مزود رسائل SMS</h4>
                           <p className="text-xs text-muted-foreground mt-1">لإرسال إشعارات الغياب والمطالبات المالية.</p>
                        </div>
                        <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm font-bold outline-none" value={systemSettings.smsProvider || "none"} onChange={e => updateSettings({smsProvider: e.target.value})}>
                          <option value="none">غير مفعل</option>
                          <option value="twilio">Twilio</option>
                          <option value="unifonic">Unifonic</option>
                        </select>
                      </div>
                   </div>
                </div>
             </PageCard>
          )}

          {tab === "mobile" && (
            <PageCard title="تطبيق الهاتف وبوابة ولي الأمر">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { title: "بوابة ولي الأمر", desc: "فواتير، نقل، نتائج، إشعارات", status: "مفعل" },
                    { title: "تطبيق المعلم", desc: "درجات، حضور، واجبات، رسائل", status: "مفعل" },
                    { title: "تطبيق الإدارة", desc: "اعتمادات وتنبيهات وتقارير", status: "تجريبي" },
                  ].map(item => (
                    <div key={item.title} className="rounded-xl border border-border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <Smartphone className="h-5 w-5 text-primary" />
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">{item.status}</span>
                      </div>
                      <div className="font-bold">{item.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="سياسة دخول الهاتف">
                    <select className={inp} value={systemSettings.mobileLoginPolicy} onChange={e => updateSettings({mobileLoginPolicy: e.target.value})}>
                      <option>رمز OTP عبر SMS أو WhatsApp</option>
                      <option>كلمة مرور + تحقق ثنائي</option>
                      <option>رابط دخول مؤقت</option>
                    </select>
                  </Field>
                  <Field label="تزامن الإشعارات">
                    <select className={inp} value={systemSettings.notifSync} onChange={e => updateSettings({notifSync: e.target.value})}>
                      <option>لحظي للغياب والفواتير والدرجات</option>
                      <option>كل 15 دقيقة</option>
                      <option>يدوي من الإدارة</option>
                    </select>
                  </Field>
                  <div className="md:col-span-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <h3 className="mb-2 font-bold text-primary">قواعد الخصوصية للهاتف</h3>
                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <label className="flex items-center gap-2"><input type="checkbox" checked={systemSettings.parentViewLimit} onChange={e => updateSettings({parentViewLimit: e.target.checked})} className="h-4 w-4" /> ولي الأمر يرى أبناءه فقط حسب رقم الهاتف المعتمد.</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={systemSettings.teacherViewLimit} onChange={e => updateSettings({teacherViewLimit: e.target.checked})} className="h-4 w-4" /> المعلم يرى الشعب والمواد المسندة له فقط.</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={systemSettings.hideFinancial} onChange={e => updateSettings({hideFinancial: e.target.checked})} className="h-4 w-4" /> إخفاء البيانات المالية عن غير المخولين.</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={systemSettings.logMobileActivity} onChange={e => updateSettings({logMobileActivity: e.target.checked})} className="h-4 w-4" /> تسجيل كل عملية من الهاتف في سجل الأنشطة.</label>
                    </div>
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {tab === "api" && (
            <PageCard title="API والربط المتقدم">
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-bold">مفتاح API الرئيسي</div>
                      <div className="text-xs text-muted-foreground">يستخدم للربط مع تطبيق الهاتف، بوابات الدفع، وأدوات التكامل.</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { navigator.clipboard?.writeText(systemSettings.apiKey); toast.success("تم نسخ مفتاح API"); }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-bold hover:bg-accent"><Copy className="h-4 w-4" /> نسخ</button>
                      <button onClick={() => { 
                          const newKey = `sk_live_school_${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
                          updateSettings({apiKey: newKey}); 
                          toast.success("تم توليد مفتاح جديد"); 
                        }} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"><RefreshCcw className="h-4 w-4" /> تدوير المفتاح</button>
                    </div>
                  </div>
                  <input value={systemSettings.apiKey} readOnly dir="ltr" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-left text-sm font-bold" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-center gap-2 font-bold"><Webhook className="h-4 w-4 text-primary" /> Webhooks</div>
                    <div className="space-y-3">
                      <Field label="رابط استقبال الأحداث"><input className={inp} dir="ltr" value={systemSettings.webhookUrl} onChange={e => updateSettings({webhookUrl: e.target.value})} /></Field>
                      <div className="grid gap-2 text-sm">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={systemSettings.whStudentCreated} onChange={e => updateSettings({whStudentCreated: e.target.checked})} className="h-4 w-4" /> student.created</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={systemSettings.whInvoicePaid} onChange={e => updateSettings({whInvoicePaid: e.target.checked})} className="h-4 w-4" /> invoice.paid</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={systemSettings.whExamUpdated} onChange={e => updateSettings({whExamUpdated: e.target.checked})} className="h-4 w-4" /> exam.grade.updated</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={systemSettings.whTransportChanged} onChange={e => updateSettings({whTransportChanged: e.target.checked})} className="h-4 w-4" /> transport.subscription.changed</label>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-center gap-2 font-bold"><Database className="h-4 w-4 text-primary" /> حدود واستخدام API</div>
                    <div className="grid gap-3">
                      <Field label="حد الطلبات بالدقيقة"><input type="number" className={inp} value={systemSettings.apiRateLimit} onChange={e => updateSettings({apiRateLimit: parseInt(e.target.value) || 0})} /></Field>
                      <Field label="نطاق الوصول"><select className={inp} value={systemSettings.apiAccessScope} onChange={e => updateSettings({apiAccessScope: e.target.value})}><option>قراءة وكتابة حسب الصلاحيات</option><option>قراءة فقط</option><option>تطبيق الهاتف فقط</option></select></Field>
                      <Field label="عناوين IP المسموحة"><textarea rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="ضع كل IP في سطر مستقل" value={systemSettings.apiAllowedIps} onChange={e => updateSettings({apiAllowedIps: e.target.value})}></textarea></Field>
                    </div>
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {tab === "security" && (
             <PageCard title="الأمان والتحكم بالدخول">
                <div className="grid gap-4 md:grid-cols-2">
                   <Field label="سياسة كلمة المرور">
                     <select className={inp} value={systemSettings.passwordPolicy} onChange={e => updateSettings({passwordPolicy: e.target.value})}>
                       <option>معقدة (حروف، أرقام، رموز)</option>
                       <option>متوسطة (حروف وأرقام)</option>
                       <option>بسيطة (أرقام فقط - غير مستحسن)</option>
                     </select>
                   </Field>
                   <Field label="مهلة الخروج التلقائي (Session Timeout)">
                     <select className={inp} value={systemSettings.sessionTimeout} onChange={e => updateSettings({sessionTimeout: e.target.value})}>
                       <option>بعد 30 دقيقة من الخمول</option>
                       <option>بعد ساعة</option>
                       <option>لا تسجل خروج</option>
                     </select>
                   </Field>
                   <div className="md:col-span-2 mt-2">
                      <div className="flex flex-col gap-3">
                         <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.force2FA} onChange={e => updateSettings({force2FA: e.target.checked})} className="h-4 w-4" /> فرض التحقق بخطوتين (2FA) للإداريين والمعلمين</label>
                         <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={systemSettings.lockAfter5Fails} onChange={e => updateSettings({lockAfter5Fails: e.target.checked})} className="h-4 w-4" /> حظر حساب المستخدم مؤقتاً بعد 5 محاولات دخول فاشلة</label>
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
                     <label className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer w-fit">
                       <input type="file" className="hidden" accept=".csv, .xlsx" onChange={(e) => { if (e.target.files?.length) toast.success("بدأت عملية استيراد ومطابقة البيانات") }} />
                       <Upload className="h-4 w-4" /> ارفع الملف الآن
                     </label>
                  </div>
                  
                  <div onClick={() => toast.success("تم إرسال طلب التصدير للخوادم، سيتم تنبيهك عند الانتهاء")} className="border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer group">
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
