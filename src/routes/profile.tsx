import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { UserCircle2, Mail, Phone, MapPin, Building2, ShieldCheck, Camera, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "الملف الشخصي | منصة مدارس" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  // Mock User Data
  const [userData, setUserData] = useState({
    name: "أحمد العتيبي",
    role: "مدير عام النظام",
    email: "ahmed@school.edu",
    phone: "0551234567",
    department: "الإدارة العليا",
    location: "الرياض - حي الواحة",
    joinDate: "١٤٤٠/٠٥/١٢ هـ",
    permissions: "صلاحيات كاملة",
  });

  const handleSave = () => {
    setIsEditing(false);
    toast.success("تم حفظ التعديلات بنجاح");
  };

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الملف الشخصي" }]}>
      
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <UserCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">الملف الشخصي</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">استعراض وتحديث بيانات حسابك الشخصي</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar & Summary Card */}
          <PageCard className="lg:col-span-1">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="relative group cursor-pointer mb-4">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary to-blue-500 p-1 shadow-lg">
                  <div className="h-full w-full rounded-full bg-card grid place-items-center border-4 border-card relative overflow-hidden">
                    <UserCircle2 className="h-20 w-20 text-muted-foreground/30" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold">{userData.name}</h2>
              <div className="text-sm text-primary font-semibold mt-1 bg-primary/10 px-3 py-1 rounded-full inline-block">
                {userData.role}
              </div>
              
              <div className="w-full mt-8 space-y-4 text-right">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">البريد الإلكتروني:</span>
                  <span className="font-semibold mr-auto">{userData.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">رقم الهاتف:</span>
                  <span className="font-semibold mr-auto" dir="ltr">{userData.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">القسم:</span>
                  <span className="font-semibold mr-auto">{userData.department}</span>
                </div>
              </div>
            </div>
          </PageCard>

          {/* Details Form Card */}
          <PageCard title="البيانات الأساسية" className="lg:col-span-2">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">الاسم الكامل</label>
                  <input 
                    type="text" 
                    value={userData.name}
                    onChange={(e) => setUserData({...userData, name: e.target.value})}
                    disabled={!isEditing}
                    className="w-full h-11 rounded-xl border border-border/50 bg-background/50 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-70 disabled:bg-muted/30"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">رقم الهاتف الجوال</label>
                  <input 
                    type="text" 
                    value={userData.phone}
                    onChange={(e) => setUserData({...userData, phone: e.target.value})}
                    disabled={!isEditing}
                    className="w-full h-11 rounded-xl border border-border/50 bg-background/50 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-70 disabled:bg-muted/30"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    value={userData.email}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                    disabled={!isEditing}
                    className="w-full h-11 rounded-xl border border-border/50 bg-background/50 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-70 disabled:bg-muted/30"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">العنوان (المدينة - الحي)</label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      value={userData.location}
                      onChange={(e) => setUserData({...userData, location: e.target.value})}
                      disabled={!isEditing}
                      className="w-full h-11 rounded-xl border border-border/50 bg-background/50 pr-10 pl-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-70 disabled:bg-muted/30"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/30">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">تاريخ الانضمام</label>
                  <input 
                    type="text" 
                    value={userData.joinDate}
                    disabled
                    className="w-full h-11 rounded-xl border border-border/50 bg-muted/30 px-4 text-sm text-muted-foreground outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">مستوى الصلاحيات</label>
                  <div className="relative">
                    <ShieldCheck className="absolute right-3 top-3.5 h-4 w-4 text-success" />
                    <input 
                      type="text" 
                      value={userData.permissions}
                      disabled
                      className="w-full h-11 rounded-xl border border-border/50 bg-muted/30 pr-10 pl-4 text-sm text-success font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-end gap-3">
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="h-10 px-5 rounded-xl border border-border/50 text-sm font-bold hover:bg-accent/50 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button 
                      onClick={handleSave}
                      className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:bg-primary/90 hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      حفظ التغييرات
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md hover:bg-primary/90 hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    تعديل البيانات
                  </button>
                )}
              </div>
            </div>
          </PageCard>
        </div>
      </div>
    </AppShell>
  );
}
