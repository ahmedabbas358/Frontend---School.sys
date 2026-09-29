import React, { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users, Plus, Phone, Mail, Printer, Eye, Pencil, Trash2, X,
  AlertCircle, Briefcase, Layers, Sparkles, QrCode, ShieldCheck,
  ShieldAlert, KeyRound, Calendar, BookOpen, CheckCircle2,
  Copy, ExternalLink, RefreshCw, Building2, Award, Clock, ArrowRight,
  CreditCard, Check, AlertTriangle, UserCog, FileText, Send, Download,
  Coins, FileCheck, Shield, HelpCircle, UserCheck, UserX, MessageSquare,
  GraduationCap, Smartphone
} from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { AdminModal } from "@/components/admin/admin-modal";
import {
  STAFF_SECTOR_CONFIG,
  getStaffSector,
  isTeachingStaff,
  matchesStaffId,
  StaffSector
} from "@/lib/staff-categories";

// =========================================================================
// 1. ADD / EDIT STAFF MODAL (MULTI-TABBED, RICH PROFESSIONAL FORM)
// =========================================================================
export interface StaffAddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any | null;
  onSave: (data: any, userAccountParams?: { shouldCreate: boolean; username: string; role: string; password?: string }) => void;
  currency: string;
  departments: string[];
  activeStageStaff: any[];
  allStaff: any[];
  currentAcademicYearId?: string;
}

export function StaffAddEditModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  currency,
  departments,
  activeStageStaff,
  allStaff,
  currentAcademicYearId
}: StaffAddEditModalProps) {
  if (!isOpen) return null;

  const isEditing = Boolean(initialData?.id);
  const [activeTab, setActiveTab] = useState<"info" | "sector" | "finance" | "account">("info");

  // Personal & Professional Info
  const [employeeNo, setEmployeeNo] = useState(initialData?.employeeNo || initialData?.id || "");
  const [name, setName] = useState(initialData?.name || "");
  const [nationalId, setNationalId] = useState(initialData?.nationalId || "");
  const [gender, setGender] = useState<"ذكر" | "أنثى">(initialData?.gender || "ذكر");
  const [role, setRole] = useState(initialData?.role || "");
  const [department, setDepartment] = useState(initialData?.department || "الشؤون التعليمية");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [emergencyPhone, setEmergencyPhone] = useState(initialData?.emergencyPhone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [status, setStatus] = useState<"active" | "on_leave" | "terminated">(initialData?.status || "active");
  const [stage, setStage] = useState<string>(initialData?.stage || "all");
  const [qualification, setQualification] = useState(initialData?.qualification || "بكالوريوس");
  const [hireDate, setHireDate] = useState(initialData?.hireDate || new Date().toISOString().split("T")[0]);

  // Financial Info
  const [paymentType, setPaymentType] = useState<"Monthly" | "Weekly" | "PerLesson" | "Hourly" | "Daily">(initialData?.paymentType || "Monthly");
  const [basicSalary, setBasicSalary] = useState<number>(initialData?.basicSalary ?? 6000);
  const [allowance, setAllowance] = useState<number>(initialData?.allowance ?? 1000);
  const [deduction, setDeduction] = useState<number>(initialData?.deduction ?? 0);
  const [bankName, setBankName] = useState(initialData?.bankName || "مصرف الراجحي");
  const [iban, setIban] = useState(initialData?.iban || "");
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || "");

  // System User Account State
  const [createAccount, setCreateAccount] = useState(!isEditing);
  const [accountUsername, setAccountUsername] = useState(
    initialData?.employeeNo 
      ? `emp_${initialData.employeeNo.toLowerCase().replace(/[^a-z0-9]/g, "")}` 
      : ""
  );
  const [accountRole, setAccountRole] = useState(
    initialData?.role?.includes("معلم") ? "معلم" : initialData?.role?.includes("محاسب") ? "محاسب مالي" : "إداري"
  );
  const [accountPassword, setAccountPassword] = useState("Staff@2026");

  // Auto-generate username when employeeNo changes
  const handleEmployeeNoChange = (val: string) => {
    setEmployeeNo(val);
    if (!isEditing && val) {
      const sanitized = val.toLowerCase().replace(/[^a-z0-9]/g, "");
      setAccountUsername(`emp_${sanitized}`);
    }
  };

  const netSalary = useMemo(() => {
    return Math.max(0, (Number(basicSalary) || 0) + (Number(allowance) || 0) - (Number(deduction) || 0));
  }, [basicSalary, allowance, deduction]);

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAccountPassword(pwd);
    toast.success("تم توليد كلمة مرور عشوائية قوية");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("يرجى إدخال اسم الموظف بالكامل");
      setActiveTab("info");
      return;
    }
    if (!role.trim()) {
      toast.error("يرجى تحديد المسمى الوظيفي");
      setActiveTab("info");
      return;
    }

    if (!isEditing && employeeNo) {
      const isDuplicate = activeStageStaff.some((s: any) => s.employeeNo === employeeNo);
      if (isDuplicate) {
        toast.error("هذا الرقم الوظيفي مستخدم مسبقاً لموظف آخر في الكادر!");
        setActiveTab("info");
        return;
      }
    }

    const payload = {
      name: name.trim(),
      employeeNo: employeeNo.trim() || undefined,
      nationalId: nationalId.trim() || undefined,
      gender,
      role: role.trim(),
      department: department.trim(),
      status,
      stage: stage as any,
      phone: phone.trim() || undefined,
      emergencyPhone: emergencyPhone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      qualification,
      hireDate,
      paymentType,
      basicSalary: Number(basicSalary) || 0,
      allowance: Number(allowance) || 0,
      deduction: Number(deduction) || 0,
      bankName,
      iban: iban.trim(),
      accountNumber: accountNumber.trim(),
      academicYearId: currentAcademicYearId,
    };

    onSave(payload, {
      shouldCreate: !isEditing && createAccount,
      username: accountUsername.trim() || (employeeNo ? `emp_${employeeNo}` : `user_${Date.now().toString().slice(-4)}`),
      role: accountRole,
      password: accountPassword,
    });

    onClose();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `تعديل بيانات: ${initialData?.name}` : "تسجيل موظف أو كادر جديد"}
      description={isEditing ? "تحديث السجل الإداري والمالي ونظام الدخول" : "إضافة موظف مع الربط المباشر بنظام الأجور والصلاحيات"}
      icon={Users}
      tone="primary"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-muted-foreground font-bold">
            صافي الراتب المتوقع: <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{netSalary.toLocaleString()} {currency}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-xl border border-input text-xs font-bold hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="h-10 px-7 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all glow-primary"
            >
              {isEditing ? "حفظ التعديلات" : "حفظ واعتماد الموظف"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Multi-Tab Navigation */}
        <div className="border-b border-border/70 flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "info" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>البيانات المهنية والشخصية</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sector")}
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "sector" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>التصنيف والنطاق</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("finance")}
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "finance" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>الأجور والبدلات</span>
          </button>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setActiveTab("account")}
              className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === "account" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>حساب الدخول للنظام</span>
            </button>
          )}
        </div>

        {/* TAB 1: PERSONAL & EMPLOYMENT INFO */}
        {activeTab === "info" && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            <div className="grid gap-3.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-bold text-foreground">الاسم الكامل <span className="text-destructive">*</span></label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                  placeholder="محمد أحمد عبد الله"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">الرقم الوظيفي (كود الموظف)</label>
                <input
                  value={employeeNo}
                  onChange={(e) => handleEmployeeNoChange(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold font-mono outline-none focus:border-primary text-left"
                  placeholder="EMP-1001"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">رقم الهوية الوطنية / الإقامة</label>
                <input
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold font-mono outline-none focus:border-primary text-left"
                  placeholder="10XXXXXXXX"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-bold text-foreground">المسمى الوظيفي <span className="text-destructive">*</span></label>
                <input
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                  placeholder="معلم رياضيات، مشرف، محاسب..."
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">القسم / الإدارة</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  <option value="القسم التعليمي">القسم التعليمي</option>
                  <option value="الإدارة العامة">الإدارة العامة</option>
                  <option value="الخدمات المساندة">الخدمات المساندة</option>
                  <option value="النقل والحركة">النقل والحركة</option>
                  <option value="المالية والحسابات">المالية والحسابات</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">الجنس</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-bold text-foreground">رقم الهاتف (الأساسي)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary text-left"
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">هاتف الطوارئ</label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary text-left"
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary text-left"
                  placeholder="employee@school.edu.sa"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-bold text-foreground">المؤهل العلمي</label>
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="دكتوراه">دكتوراه</option>
                  <option value="ماجستير">ماجستير</option>
                  <option value="بكالوريوس">بكالوريوس</option>
                  <option value="دبلوم عالي">دبلوم عالي</option>
                  <option value="ثانوية عامة">ثانوية عامة أو ما يعادلها</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">تاريخ المباشرة / التعيين</label>
                <input
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">حالة الموظف</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="active">على رأس العمل (نشط)</option>
                  <option value="on_leave">في إجازة</option>
                  <option value="terminated">منتهي الخدمة / مؤرشف</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block font-bold text-foreground">العنوان السكني</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                placeholder="المدينة، الحي، الشارع..."
              />
            </div>
          </div>
        )}

        {/* TAB 2: SECTOR & TEACHING CLASSIFICATION */}
        {activeTab === "sector" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/80">
              <span className="font-black text-sm text-foreground block mb-2">النطاق الأكاديمي والمرحلة الدراسية</span>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-foreground">المرحلة المخصصة للموظف</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="all">كافة المراحل (شامل للمدرسة)</option>
                    <option value="primary">المرحلة الابتدائية</option>
                    <option value="middle">المرحلة المتوسطة</option>
                    <option value="secondary">المرحلة الثانوية</option>
                    <option value="kindergarten">مرحلة رياض الأطفال</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-foreground">تصنيف الكادر التلقائي</label>
                  <div className="h-10 rounded-xl border border-border bg-card px-3 flex items-center font-bold text-xs text-primary">
                    {role.includes("معلم") ? "كادر تعليمي وتدريسي" : role.includes("سائق") ? "كادر النقل المدرسي" : role.includes("حارس") || role.includes("عامل") ? "كادر الخدمات والصيانة" : "كادر إداري وإشرافي"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-2">
              <div className="flex items-center gap-2 text-primary font-black text-xs">
                <GraduationCap className="h-4 w-4" />
                <span>الارتباط بالجدول المدرسي وإسناد الحصص</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
                في حال كان الموظف كادراً تعليمياً (معلماً)، سيتمكن مدير المدرسة والوكيل من إسناد المواد والشعب الدراسية إليه مباشرة مع تتبع نصاب الحصص الأسبوعي ورصد الحضور والدرجات.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: SALARY & BANKING INFO */}
        {activeTab === "finance" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-foreground">نظام دفع الأجر / الراتب</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Monthly">راتب شهري ثابت</option>
                  <option value="PerLesson">أجر بالحصة الدراسية</option>
                  <option value="Hourly">أجر بالساعة</option>
                  <option value="Daily">يومية</option>
                  <option value="Weekly">أسبوعي</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">الراتب الأساسي ({currency}) <span className="text-destructive">*</span></label>
                <input
                  type="number"
                  min={0}
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(Number(e.target.value) || 0)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-black outline-none focus:border-primary tabular-nums"
                />
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-foreground">البدلات الشهرية (سكن، نقل، طبيعة عمل) ({currency})</label>
                <input
                  type="number"
                  min={0}
                  value={allowance}
                  onChange={(e) => setAllowance(Number(e.target.value) || 0)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-black outline-none focus:border-primary tabular-nums text-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">الاستقطاعات الدورية (تأمينات، قروض) ({currency})</label>
                <input
                  type="number"
                  min={0}
                  value={deduction}
                  onChange={(e) => setDeduction(Number(e.target.value) || 0)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-black outline-none focus:border-primary tabular-nums text-destructive"
                />
              </div>
            </div>

            {/* Net Salary Preview KPI */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-xs">صافي الراتب المستحق للصرف:</span>
                <span className="text-[11px] text-muted-foreground">الأساسي + البدلات - الاستقطاعات</span>
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {netSalary.toLocaleString()} {currency}
              </div>
            </div>

            {/* Banking Info */}
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-foreground">اسم البنك المعتمد</label>
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                  placeholder="مصرف الراجحي، بنك الرياض، الخرطوم..."
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-foreground">رقم الآيبان البنكي (IBAN)</label>
                <input
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold font-mono outline-none focus:border-primary text-left"
                  placeholder="SA0000000000000000000000"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM USER ACCOUNT */}
        {!isEditing && activeTab === "account" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl border border-border/80 bg-muted/20">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-black text-sm text-foreground block">
                    إنشاء حساب مستخدم للنظام تلقائياً لهذا الموظف
                  </span>
                  <span className="text-[11px] text-muted-foreground font-bold">
                    تمكين الموظف من تسجيل الدخول إلى منصة المدرسة بصلاحيات مخصصة بحسب دوره الوظيفي.
                  </span>
                </div>
              </label>
            </div>

            {createAccount && (
              <div className="space-y-3.5 p-4 rounded-2xl border border-primary/20 bg-primary/5">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-bold text-foreground">اسم المستخدم للدخول <span className="text-destructive">*</span></label>
                    <input
                      value={accountUsername}
                      onChange={(e) => setAccountUsername(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold font-mono outline-none focus:border-primary text-left"
                      dir="ltr"
                      placeholder="emp_user"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-foreground">الدور والصلاحيات في المنظومة <span className="text-destructive">*</span></label>
                    <select
                      value={accountRole}
                      onChange={(e) => setAccountRole(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="معلم">معلم (تسجيل حضور، درجات، جداول)</option>
                      <option value="إداري">إداري (شؤون موظفين وطلاب)</option>
                      <option value="مشرف أكاديمي">مشرف أكاديمي (إشراف ومراقبة)</option>
                      <option value="محاسب مالي">محاسب مالي (مالية ورسوم ومصاريف)</option>
                      <option value="أمين تسجيل">أمين تسجيل وقبول</option>
                      <option value="مدير مدرسة">مدير مدرسة (صلاحيات كاملة للمرحلة)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-foreground">كلمة المرور الابتدائية</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> توليد عشوائي
                    </button>
                  </div>
                  <input
                    type="text"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold font-mono outline-none focus:border-primary text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminModal>
  );
}

// =========================================================================
// 2. STAFF USER ACCOUNT MODAL (LINK OR MANAGE SYSTEM USER)
// =========================================================================
export interface StaffUserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  linkedUser: any | null;
  onLinkOrCreate: (userData: any) => void;
  onResetPassword?: (userId: string, newPassword: string) => void;
  onToggleUserStatus?: (userId: string, newStatus: "active" | "disabled") => void;
}

export function StaffUserAccountModal({
  isOpen,
  onClose,
  staff,
  linkedUser,
  onLinkOrCreate,
  onResetPassword,
  onToggleUserStatus,
}: StaffUserAccountModalProps) {
  if (!isOpen || !staff) return null;

  const [username, setUsername] = useState(
    linkedUser?.username || `emp_${(staff.employeeNo || staff.id).toString().toLowerCase().replace(/[^a-z0-9]/g, "")}`
  );
  const [role, setAccountRole] = useState(
    linkedUser?.role || (staff.role.includes("معلم") ? "معلم" : staff.role.includes("محاسب") ? "محاسب مالي" : "إداري")
  );
  const [generatedPassword, setGeneratedPassword] = useState("Staff@2026");
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCredentials = () => {
    const text = `بيانات الدخول إلى منصة المدرسة:\nالاسم: ${staff.name}\nاسم المستخدم: ${username}\nكلمة المرور: ${generatedPassword}\nالرابط: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("تم نسخ بيانات الدخول إلى الحافظة للإرسال عبر واتساب أو الرسائل");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const text = `السلام عليكم ورحمة الله وبركاته،\nالأستاذ/ة: ${staff.name}\n\nيسر إدارة المدرسة تزويدكم ببيانات حسابكم على المنصة الإلكترونية:\n- اسم المستخدم: ${username}\n- كلمة المرور: ${generatedPassword}\n- رابط الدخول: ${window.location.origin}\n\nنرجو المبادرة بتغيير كلمة المرور بعد أول تسجيل دخول.`;
    const cleanPhone = (staff.phone || "").replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      toast.error("لا يوجد رقم هاتف مسجل لهذا الموظف");
      return;
    }
    const formattedPhone = cleanPhone.startsWith("0") ? `966${cleanPhone.slice(1)}` : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, "_blank");
    toast.success("جاري فتح واتساب لإرسال بيانات الاعتماد...");
  };

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setGeneratedPassword(pwd);
    if (linkedUser && onResetPassword) {
      onResetPassword(linkedUser.id, pwd);
      toast.success("تم تحديث كلمة المرور وتعيينها فورياً في النظام!");
    } else {
      toast.success("تم توليد كلمة مرور جديدة");
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("يرجى إدخال اسم المستخدم");
      return;
    }

    onLinkOrCreate({
      username: username.trim(),
      fullName: staff.name,
      role,
      status: "active",
      staffId: staff.id,
      email: staff.email || "",
      phone: staff.phone || "",
      notes: `حساب مرتبط بالموظف ${staff.name} (كود: ${staff.employeeNo || staff.id})`,
      lastLogin: "لم يسجل دخول بعد",
      stageScope: staff.stage || "all",
      twoFactorEnabled: false,
      createdAt: new Date().toISOString().split("T")[0]
    });

    toast.success(`تم إنشاء وربط حساب المستخدم @${username} بنجاح`);
    onClose();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={linkedUser ? `إدارة حساب الدخول: @${linkedUser.username}` : `إنشاء حساب دخول للموظف: ${staff.name}`}
      description={linkedUser ? "التحكم في كلمة المرور وحالة التفعيل والصلاحيات" : "ربط الموظف بحساب مستخدم في النظام بصلاحيات مخصصة"}
      icon={KeyRound}
      tone="primary"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-input font-bold hover:bg-accent text-xs"
          >
            إغلاق
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {linkedUser ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Status & User Info */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-foreground">@{linkedUser.username}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    linkedUser.status === "active" ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive"
                  }`}>
                    {linkedUser.status === "active" ? "حساب نشط" : "حساب معطل"}
                  </span>
                </div>
                {onToggleUserStatus && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = linkedUser.status === "active" ? "disabled" : "active";
                      onToggleUserStatus(linkedUser.id, next);
                    }}
                    className={`text-xs font-bold px-3 py-1 rounded-xl transition-all ${
                      linkedUser.status === "active"
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                    }`}
                  >
                    {linkedUser.status === "active" ? "تعطيل الحساب" : "تفعيل الحساب"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/70">
                <div>
                  <span className="text-muted-foreground font-bold">الدور المعتمد: </span>
                  <span className="font-black text-primary">{linkedUser.role}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">نطاق المرحلة: </span>
                  <span className="font-bold">{linkedUser.stageScope === "all" ? "كافة المراحل" : linkedUser.stageScope || "عام"}</span>
                </div>
              </div>
            </div>

            {/* Reset Password & Share Credentials Suite */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-foreground">إعادة تعيين كلمة المرور والمشاركة:</span>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-xs text-primary hover:underline font-black flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> توليد وحفظ جديد
                </button>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/80 font-mono text-sm font-bold justify-between" dir="ltr">
                <span>{generatedPassword}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                    toast.success("تم نسخ كلمة المرور فقط");
                  }}
                  className="text-primary hover:text-primary/80"
                  title="نسخ كلمة المرور"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {staff.phone && (
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="h-10 rounded-xl bg-[#25D366] text-white text-xs font-black hover:bg-[#20ba59] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Send className="h-3.5 w-3.5" /> إرسال عبر واتساب
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className={`h-10 rounded-xl border border-border bg-card text-xs font-black hover:bg-accent transition-colors flex items-center justify-center gap-1.5 shadow-xs ${!staff.phone ? "col-span-2" : ""}`}
                >
                  <Copy className="h-3.5 w-3.5 text-primary" />
                  <span>{isCopied ? "تم النسخ!" : "نسخ الرسالة كاملة"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold">
              لا يوجد حساب نظام مرتبط بهذا الموظف حالياً. يمكنك إنشاء حساب دخول فوري وتحديد الدور المناسب له.
            </div>

            <div>
              <label className="mb-1 block font-bold text-foreground text-xs">اسم المستخدم للدخول *</label>
              <input
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold font-mono outline-none focus:border-primary text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-foreground text-xs">الدور والصلاحيات في المنظومة *</label>
              <select
                value={role}
                onChange={(e) => setAccountRole(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                <option value="معلم">معلم (تسجيل حضور، درجات، جداول)</option>
                <option value="إداري">إداري (شؤون موظفين وطلاب)</option>
                <option value="مشرف أكاديمي">مشرف أكاديمي (إشراف ومراقبة)</option>
                <option value="محاسب مالي">محاسب مالي (مالية ورسوم ومصاريف)</option>
                <option value="أمين تسجيل">أمين تسجيل وقبول</option>
                <option value="مدير مدرسة">مدير مدرسة (صلاحيات كاملة للمرحلة)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-foreground text-xs">كلمة المرور الابتدائية</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> توليد عشوائي
                </button>
              </div>
              <input
                type="text"
                value={generatedPassword}
                onChange={(e) => setGeneratedPassword(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold font-mono outline-none focus:border-primary text-left"
                dir="ltr"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md hover:bg-primary/90 glow-primary transition-all"
              >
                إنشاء وتفعيل الحساب
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminModal>
  );
}

// =========================================================================
// 3. STAFF QUICK LEAVE MODAL (INSTANT LEAVE REGISTRATION)
// =========================================================================
export interface StaffQuickLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  allStaff: any[];
  onSaveLeave: (leaveData: any, setStaffOnLeave: boolean) => void;
}

export function StaffQuickLeaveModal({
  isOpen,
  onClose,
  staff,
  allStaff,
  onSaveLeave,
}: StaffQuickLeaveModalProps) {
  if (!isOpen || !staff) return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const [type, setType] = useState<"annual" | "sick" | "emergency" | "issued">("annual");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [replacementId, setReplacementId] = useState("");
  const [notes, setNotes] = useState("");
  const [syncStatus, setSyncStatus] = useState(true);

  const daysCount = useMemo(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
    return Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
  }, [startDate, endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (daysCount <= 0) {
      toast.error("يرجى اختيار تاريخ نهاية صحيح بعد تاريخ البداية");
      return;
    }

    const replacementStaff = allStaff.find((s) => s.id === replacementId);

    const payload = {
      staffId: staff.id,
      staffName: staff.name,
      type,
      startDate,
      endDate,
      days: daysCount,
      replacementStaffId: replacementId || undefined,
      replacementStaffName: replacementStaff?.name || undefined,
      notes: notes.trim() || undefined,
      status: "approved" as const,
      approvedBy: "مدير الموارد البشرية",
      approvedAt: todayStr,
    };

    onSaveLeave(payload, syncStatus);
    toast.success(`تم تسجيل الإجازة للموظف ${staff.name} بنجاح (${daysCount} يوم)`);
    onClose();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل إجازة / استئذان فوري"
      description={`${staff.name} — ${staff.role} (${staff.department})`}
      icon={Calendar}
      tone="warning"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs font-black text-amber-600 dark:text-amber-400">
            المدة المحتسبة: <span className="tabular-nums font-mono">{daysCount} يوم</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-xl border border-input font-bold hover:bg-accent text-xs"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md hover:bg-primary/90 glow-primary transition-all"
            >
              اعتماد وتسجيل الإجازة
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-bold text-foreground">نوع الإجازة</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
            >
              <option value="annual">إجازة سنوية اعتيادية</option>
              <option value="sick">إجازة مرضية (بتقرير طبي)</option>
              <option value="emergency">إجازة اضطرارية / عاجلة</option>
              <option value="issued">إجازة استثنائية (بدون راتب)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold text-foreground">الموظف البديل لتغطية المهام</label>
            <select
              value={replacementId}
              onChange={(e) => setReplacementId(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
            >
              <option value="">-- اختياري --</option>
              {allStaff.filter(s => s.id !== staff.id && s.department === staff.department).map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-bold text-foreground">تاريخ بداية الإجازة *</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block font-bold text-foreground">تاريخ نهاية الإجازة *</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="p-3 bg-muted/30 border border-border/70 rounded-xl flex items-center justify-between">
          <span className="font-bold text-muted-foreground">المدة الإجمالية المحتسبة:</span>
          <span className="text-sm font-black text-primary tabular-nums">{daysCount} يوم</span>
        </div>

        <div>
          <label className="mb-1 block font-bold text-foreground">مسوغات الغياب أو ملاحظات الإدارة</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="بيان سبب الإجازة أو رقم المرجع الطبي..."
            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-bold outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={syncStatus}
              onChange={(e) => setSyncStatus(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-bold text-foreground text-xs">
              تحديث حالة الموظف فورياً في سجل الدوام العام إلى (في إجازة)
            </span>
          </label>
        </div>
      </form>
    </AdminModal>
  );
}

// =========================================================================
// 4. STAFF TEACHING ASSIGNMENTS MODAL (CLASSES & SUBJECTS MANAGEMENT)
// =========================================================================
export interface StaffTeachingAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  subjects: any[];
  sections: any[];
  assignments: any[];
  onAddAssignment: (assignment: any) => void;
  onDeleteAssignment: (id: string) => void;
}

export function StaffTeachingAssignmentsModal({
  isOpen,
  onClose,
  staff,
  subjects,
  sections,
  assignments,
  onAddAssignment,
  onDeleteAssignment,
}: StaffTeachingAssignmentsModalProps) {
  if (!isOpen || !staff) return null;

  const [subjectId, setSubjectId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [periodsPerWeek, setPeriodsPerWeek] = useState(4);

  const teacherAssignments = useMemo(() => {
    return assignments.filter((a) => matchesStaffId(staff, a.teacherId));
  }, [assignments, staff]);

  const totalPeriods = useMemo(() => {
    return teacherAssignments.reduce((acc, curr) => acc + (curr.periodsPerWeek || 4), 0);
  }, [teacherAssignments]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !sectionId) {
      toast.error("يرجى اختيار المادة الدراسية والشعبة");
      return;
    }

    const isDuplicate = teacherAssignments.some(
      (a) => a.subjectId === subjectId && a.sectionId === sectionId
    );
    if (isDuplicate) {
      toast.error("هذه المادة والشعبة مسندة بالفعل لهذا المعلم!");
      return;
    }

    onAddAssignment({
      teacherId: staff.id,
      teacherName: staff.name,
      subjectId,
      sectionId,
      periodsPerWeek: Number(periodsPerWeek) || 4,
    });

    toast.success("تم إسناد التكليف الأكاديمي بنجاح");
    setSubjectId("");
    setSectionId("");
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="التكليف الأكاديمي وجدول الحصص"
      description={`${staff.name} — إجمالي الحصص الأسبوعية: ${totalPeriods} حصة`}
      icon={BookOpen}
      tone="primary"
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs font-bold text-muted-foreground">
            المواد والشعب المسندة: <span className="font-black text-primary tabular-nums">{teacherAssignments.length}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-6 rounded-xl border border-input font-bold hover:bg-accent text-xs"
          >
            إغلاق
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Workload Progress Bar */}
        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-muted-foreground">عبء التدريس الأسبوعي (الحد الأقصى المعتاد: 24 حصة):</span>
            <span className={`font-black tabular-nums ${totalPeriods > 24 ? "text-destructive" : "text-primary"}`}>
              {totalPeriods} / 24 حصة
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                totalPeriods > 24 ? "bg-destructive" : totalPeriods >= 20 ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, (totalPeriods / 24) * 100)}%` }}
            />
          </div>
        </div>

        {/* Current Assignments List */}
        <div className="space-y-2">
          <span className="font-black text-foreground block">
            المواد والفصول المسندة حالياً ({teacherAssignments.length})
          </span>

          {teacherAssignments.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-border text-center text-muted-foreground">
              لم يتم إسناد أي مواد أو فصول دراسية لهذا المعلم حتى الآن.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {teacherAssignments.map((a) => {
                const sub = subjects.find((s) => s.id === a.subjectId);
                const sec = sections.find((s) => s.id === a.sectionId);
                return (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center font-bold">
                        {sub?.name?.charAt(0) || "م"}
                      </div>
                      <div>
                        <div className="font-black text-foreground">{sub?.name || "مادة دراسية"}</div>
                        <div className="text-[11px] text-muted-foreground font-bold">
                          الشعبة: {sec ? `${sec.grade} - ${sec.name}` : "شعبة عامة"} • {a.periodsPerWeek || 4} حصص/أسبوع
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteAssignment(a.id)}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      title="إلغاء التكليف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add New Assignment Form */}
        <form onSubmit={handleAdd} className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
          <span className="font-black text-primary block">إسناد مادة وفصل دراسي جديد</span>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block font-bold text-foreground">المادة الدراسية *</label>
              <select
                required
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="h-9 w-full rounded-xl border border-input bg-background px-2.5 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                <option value="">-- اختر المادة --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-foreground">الشعبة والفصل *</label>
              <select
                required
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="h-9 w-full rounded-xl border border-input bg-background px-2.5 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                <option value="">-- اختر الشعبة --</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>{sec.grade} - {sec.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-foreground">الحصص أسبوعياً</label>
              <input
                type="number"
                min={1}
                max={30}
                value={periodsPerWeek}
                onChange={(e) => setPeriodsPerWeek(Number(e.target.value) || 1)}
                className="h-9 w-full rounded-xl border border-input bg-background px-2.5 text-xs font-black outline-none focus:border-primary tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="h-9 px-5 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs hover:bg-primary/90 flex items-center gap-1.5 glow-primary"
            >
              <Plus className="h-3.5 w-3.5" /> إضافة التكليف
            </button>
          </div>
        </form>
      </div>
    </AdminModal>
  );
}

// =========================================================================
// 5. STAFF QUICK PREVIEW MODAL (EXECUTIVE SUMMARY CARD)
// =========================================================================
export interface StaffQuickPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  linkedUser: any | null;
  currency: string;
  onOpenEdit: () => void;
  onOpenBadge: () => void;
  onOpenUserAccount: () => void;
  onOpenLeave: () => void;
  onOpenAssignments?: () => void;
  onOpenDocument?: () => void;
  onOpenAdvance?: () => void;
}

export function StaffQuickPreviewModal({
  isOpen,
  onClose,
  staff,
  linkedUser,
  currency,
  onOpenEdit,
  onOpenBadge,
  onOpenUserAccount,
  onOpenLeave,
  onOpenAssignments,
  onOpenDocument,
  onOpenAdvance,
}: StaffQuickPreviewModalProps) {
  if (!isOpen || !staff) return null;

  const isTeacher = isTeachingStaff(staff);
  const netSalary = Math.max(0, (staff.basicSalary || 0) + (staff.allowance || 0) - (staff.deduction || 0));

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={staff.name}
      description={`${staff.role} • ${staff.department}`}
      icon={UserCheck}
      tone="primary"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Link
            to={isTeacher ? `/teachers/${staff.employeeNo || staff.id}` : `/hr/staff/${staff.employeeNo || staff.id}` as any}
            className="text-xs font-black text-primary hover:underline flex items-center gap-1"
          >
            الانتقال للملف الشامل للموظف <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { onClose(); onOpenEdit(); }}
              className="h-9 px-4 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs hover:bg-primary/90 glow-primary"
            >
              تعديل البيانات
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-input font-bold text-xs hover:bg-accent"
            >
              إغلاق
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Header Profile Cover */}
        <div className="p-4 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-2xl border border-border/70 text-center relative">
          <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-2xl font-black shadow-lg">
            {staff.name.charAt(0)}
          </div>
          <h3 className="text-base font-black text-foreground mt-2.5">{staff.name}</h3>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground mt-0.5">
            <span>{staff.role}</span>
            <span>•</span>
            <span>{staff.department}</span>
          </div>

          <div className="flex items-center justify-center gap-2 mt-2.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
              staff.status === "active" ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
            }`}>
              {staff.status === "active" ? "على رأس العمل" : "في إجازة"}
            </span>

            {linkedUser ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> حساب نظام: @{linkedUser.username}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-muted text-muted-foreground">
                بدون حساب دخول
              </span>
            )}
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/60">
            <span className="text-[10px] text-muted-foreground font-bold block">الرقم الوظيفي</span>
            <span className="text-sm font-black font-mono text-foreground tabular-nums">
              {staff.employeeNo || staff.id}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/60">
            <span className="text-[10px] text-muted-foreground font-bold block">صافي الراتب</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {netSalary.toLocaleString()} {currency}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-muted/30 border border-border/60">
            <span className="text-[10px] text-muted-foreground font-bold block">النطاق الأكاديمي</span>
            <span className="text-xs font-black text-foreground">
              {staff.stage === "all" ? "كافة المراحل" : staff.stage}
            </span>
          </div>
        </div>

        {/* Contact & Bank Details */}
        <div className="space-y-2 p-3.5 rounded-2xl border border-border/60 bg-muted/20">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-bold">الهاتف:</span>
            <span className="font-bold font-mono" dir="ltr">{staff.phone || "غير مسجل"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-bold">البريد الإلكتروني:</span>
            <span className="font-bold" dir="ltr">{staff.email || "غير مسجل"}</span>
          </div>
          {staff.iban && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-bold">الحساب البنكي:</span>
              <span className="font-mono text-[11px]" dir="ltr">{staff.iban}</span>
            </div>
          )}
        </div>

        {/* Actions Suite */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => { onClose(); onOpenUserAccount(); }}
            className="h-10 rounded-xl border border-border bg-card hover:bg-accent font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5 text-primary" />
            <span>{linkedUser ? "إدارة حساب الدخول" : "إنشاء حساب دخول"}</span>
          </button>

          <button
            onClick={() => { onClose(); onOpenLeave(); }}
            className="h-10 rounded-xl border border-border bg-card hover:bg-accent font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-amber-600" />
            <span>تسجيل إجازة فورية</span>
          </button>

          {isTeacher && onOpenAssignments && (
            <button
              onClick={() => { onClose(); onOpenAssignments(); }}
              className="h-10 rounded-xl border border-border bg-card hover:bg-accent font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
              <span>إسناد المواد والفصول</span>
            </button>
          )}

          <button
            onClick={() => { onClose(); onOpenBadge(); }}
            className="h-10 rounded-xl border border-border bg-card hover:bg-accent font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <QrCode className="h-3.5 w-3.5 text-primary" />
            <span>طباعة بطاقة الهوية</span>
          </button>

          {onOpenDocument && (
            <button
              onClick={() => { onClose(); onOpenDocument(); }}
              className="h-10 rounded-xl border border-border bg-card hover:bg-accent font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <span>تعريف بالراتب / وثائق</span>
            </button>
          )}

          {onOpenAdvance && (
            <button
              onClick={() => { onClose(); onOpenAdvance(); }}
              className="h-10 rounded-xl border border-border bg-card hover:bg-accent font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Coins className="h-3.5 w-3.5 text-indigo-600" />
              <span>طلب سلفة مالية</span>
            </button>
          )}
        </div>
      </div>
    </AdminModal>
  );
}

// =========================================================================
// 6. STAFF SMART BADGE MODAL (PRINTABLE OFFICIAL CARD)
// =========================================================================
export interface StaffSmartBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  schoolName?: string;
  schoolLogo?: string;
}

export function StaffSmartBadgeModal({
  isOpen,
  onClose,
  staff,
  schoolName = "منظومة مدارس الريادة الحديثة",
  schoolLogo,
}: StaffSmartBadgeModalProps) {
  if (!isOpen || !staff) return null;

  const [cardSide, setCardSide] = useState<"front" | "back">("front");
  const empCode = staff.employeeNo || staff.id;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="بطاقة الهوية الذكية المعتمدة"
      description="بطاقة تعريفية رقمية ومطبوعة رسمية برمز QR"
      icon={QrCode}
      tone="primary"
      maxWidth="sm"
      footer={
        <div className="flex items-center justify-between w-full print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 h-10 px-5 text-xs font-black text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md glow-primary"
          >
            <Printer className="h-4 w-4" /> طباعة البطاقة الرسمية
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-center">
        {/* Side Toggle (Front / Back) */}
        <div className="flex justify-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setCardSide("front")}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              cardSide === "front" ? "bg-primary text-primary-foreground shadow-xs glow-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            الواجهة الأمامية
          </button>
          <button
            type="button"
            onClick={() => setCardSide("back")}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              cardSide === "back" ? "bg-primary text-primary-foreground shadow-xs glow-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            الواجهة الخلفية
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="print:m-0 print:p-0 pt-2">
          {cardSide === "front" ? (
            /* FRONT OF BADGE */
            <div className="w-full max-w-[320px] mx-auto rounded-3xl border-2 border-primary/30 bg-gradient-to-b from-card via-card/95 to-primary/10 p-5 shadow-xl text-center relative overflow-hidden print:border-none print:shadow-none">
              {/* Luxury Accent Ribbon */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-emerald-500 to-primary" />

              {/* School Brand */}
              <div className="flex items-center justify-center gap-2 mt-1 mb-2">
                {schoolLogo ? (
                  <img src={schoolLogo} alt="Logo" className="h-7 w-7 object-contain" />
                ) : (
                  <Building2 className="h-5 w-5 text-primary" />
                )}
                <span className="text-[11px] font-black text-foreground tracking-wide">
                  {schoolName}
                </span>
              </div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/70 pb-2">
                STAFF IDENTIFICATION CARD
              </div>

              {/* Photo Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-primary/70 text-primary-foreground mx-auto my-3 grid place-items-center border-2 border-primary/40 shadow-md">
                <span className="text-2xl font-black">{staff.name.charAt(0)}</span>
              </div>

              {/* Name & Role */}
              <h4 className="text-base font-black text-foreground">{staff.name}</h4>
              <div className="text-xs font-black text-primary mt-0.5">{staff.role}</div>
              <div className="text-[11px] text-muted-foreground font-bold mt-0.5">{staff.department}</div>

              {/* QR Code & Code */}
              <div className="my-3 p-2 bg-white rounded-xl border border-slate-200 inline-block shadow-xs">
                <QRCode value={`https://school.example.sd/verify?id=${empCode}`} size={80} />
                <div className="text-[9px] font-mono text-slate-800 mt-1 font-black" dir="ltr">
                  ID: {empCode}
                </div>
              </div>

              {/* Hologram / Security Seal */}
              <div className="flex items-center justify-between border-t border-border/80 pt-2 text-[10px] text-muted-foreground font-bold">
                <span>الحالة: {staff.status === "active" ? "ساري المفعول" : "معلق"}</span>
                <span className="inline-flex items-center gap-1 text-primary">
                  <ShieldCheck className="h-3 w-3" /> معتمد رسمياً
                </span>
              </div>
            </div>
          ) : (
            /* BACK OF BADGE */
            <div className="w-full max-w-[320px] mx-auto rounded-3xl border-2 border-primary/30 bg-card p-5 shadow-xl text-center relative overflow-hidden print:border-none print:shadow-none text-xs space-y-3">
              {/* Magnetic Stripe Simulator */}
              <div className="h-8 bg-slate-900 -mx-5 -mt-5 mb-3" />

              <div className="text-[11px] font-black text-foreground">تعليمات وضوابط استخدام البطاقة</div>
              <p className="text-[10px] text-muted-foreground font-bold leading-relaxed text-right">
                • هذه البطاقة وثيقة رسمية صادرة عن إدارة المدرسة ويجب إبرازها عند الطلب.
                <br />• يرجى إعادة البطاقة فوراً لإدارة الموارد البشرية عند انتهاء فترة العمل.
                <br />• في حال العثور على هذه البطاقة يرجى الاتصال بإدارة المدرسة فوراً.
              </p>

              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-right space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold">هاتف الطوارئ:</span>
                  <span className="font-mono font-bold" dir="ltr">{staff.phone || "0500000000"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold">تاريخ الإصدار:</span>
                  <span className="font-mono font-bold tabular-nums">2026/2027</span>
                </div>
              </div>

              {/* Barcode Simulator */}
              <div className="pt-2 border-t border-border flex flex-col items-center">
                <div className="h-7 w-48 bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_4px,#000_4px,#000_7px,transparent_7px,transparent_9px)]" />
                <span className="text-[9px] font-mono text-muted-foreground mt-1" dir="ltr">*{empCode}*</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminModal>
  );
}

// =========================================================================
// 7. STAFF DELETE CONFIRMATION MODAL
// =========================================================================
export interface StaffDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  onConfirmDelete: () => void;
}

export function StaffDeleteConfirmModal({
  isOpen,
  onClose,
  staff,
  onConfirmDelete,
}: StaffDeleteConfirmModalProps) {
  if (!isOpen || !staff) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="تأكيد أرشفة ونقل الموظف لسلة المحذوفات"
      description={`الموظف: ${staff.name} (كود: ${staff.employeeNo || staff.id})`}
      icon={Trash2}
      tone="danger"
      maxWidth="sm"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-input text-xs font-bold hover:bg-accent transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-xs font-black hover:bg-destructive/90 shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" /> تأكيد الحذف
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-xs leading-relaxed font-bold text-muted-foreground">
        <p>
          هل أنت متأكد من رغبتك في أرشفة الموظف <strong className="text-foreground">{staff.name}</strong>؟
        </p>
        <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] space-y-1">
          <span className="font-black block">إجراءات الأرشفة التلقائية:</span>
          <ul className="list-disc list-inside space-y-0.5">
            <li>نقل سجل الموظف إلى سلة المحذوفات المركزية (يمكن استرجاعه لاحقاً).</li>
            <li>تعطيل حساب الدخول المرتبط بالموظف في المنظومة.</li>
            <li>إلغاء ارتباطه بالمواد والشعب الدراسية وجدول الحصص.</li>
          </ul>
        </div>
      </div>
    </AdminModal>
  );
}

// =========================================================================
// 8. STAFF OFFICIAL DOCUMENTS MODAL (SALARY CERTIFICATE & CLEARANCE)
// =========================================================================
export interface StaffDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  currency: string;
  schoolName?: string;
  stampUrl?: string;
}

export function StaffDocumentModal({
  isOpen,
  onClose,
  staff,
  currency,
  schoolName = "منظومة مدارس الريادة الحديثة",
  stampUrl,
}: StaffDocumentModalProps) {
  if (!isOpen || !staff) return null;

  const [docType, setDocType] = useState<"salary_cert" | "experience_cert" | "clearance">("salary_cert");
  const netSalary = Math.max(0, (staff.basicSalary || 0) + (staff.allowance || 0) - (staff.deduction || 0));

  const handlePrint = () => {
    window.print();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="إصدار الخطابات والمستندات الإدارية الرسمية"
      description={`${staff.name} — ${staff.role} (${staff.department})`}
      icon={FileCheck}
      tone="info"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-input text-xs font-bold hover:bg-accent"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md glow-primary flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" /> طباعة المستند الرسمي
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Doc Type Selector */}
        <div className="border-b border-border/70 flex gap-2 pb-1 print:hidden">
          <button
            type="button"
            onClick={() => setDocType("salary_cert")}
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              docType === "salary_cert" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>شهادة تعريف بالراتب</span>
          </button>
          <button
            type="button"
            onClick={() => setDocType("experience_cert")}
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              docType === "experience_cert" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>شهادة خبرة وخدمة</span>
          </button>
          <button
            type="button"
            onClick={() => setDocType("clearance")}
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              docType === "clearance" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>إخلاء طرف وتسليم عهدة</span>
          </button>
        </div>

        {/* Printable Document Paper */}
        <div className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-sm" dir="rtl">
          <div className="space-y-6 text-right">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">{schoolName}</h2>
                <span className="text-[11px] text-slate-600 font-bold block">إدارة الموارد البشرية وشؤون الموظفين</span>
              </div>
              <div className="text-left text-[11px] font-mono text-slate-600" dir="ltr">
                <div>Date: {new Date().toLocaleDateString("en-CA")}</div>
                <div>Ref: HR-{staff.employeeNo || staff.id}-{Date.now().toString().slice(-4)}</div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-2">
              <span className="inline-block border-b-2 border-primary pb-1 text-sm font-black text-slate-900">
                {docType === "salary_cert" && "شهادة تعريف وتفصيل الراتب الرسمي"}
                {docType === "experience_cert" && "شهادة خبرة وبيان مدة الخدمة"}
                {docType === "clearance" && "نموذج إخلاء طرف وتسليم العهد"}
              </span>
            </div>

            {/* Content Body */}
            {docType === "salary_cert" && (
              <div className="space-y-4 text-xs font-medium leading-relaxed text-slate-800">
                <p>تشهد إدارة المدرسة بأن الموظف الموضحة بياناته أدناه يعمل لدينا ولا يزال على رأس العمل:</p>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5">
                  <div className="grid grid-cols-2">
                    <span><strong>الاسم:</strong> {staff.name}</span>
                    <span><strong>الرقم الوظيفي:</strong> {staff.employeeNo || staff.id}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span><strong>المسمى الوظيفي:</strong> {staff.role}</span>
                    <span><strong>القسم:</strong> {staff.department}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span><strong>تاريخ المباشرة:</strong> {staff.hireDate || "2024/09/01"}</span>
                    <span><strong>رقم الهوية:</strong> {staff.nationalId || "غير مسجل"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-900 block">تفصيل المستحقات المالية الشهرية:</span>
                  <table className="w-full text-center border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-slate-300 p-2">الراتب الأساسي</th>
                        <th className="border border-slate-300 p-2">البدلات الشهرية</th>
                        <th className="border border-slate-300 p-2">الاستقطاعات الدورية</th>
                        <th className="border border-slate-300 p-2 text-primary font-black">صافي الراتب المستحق</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-2 tabular-nums">{(staff.basicSalary || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 tabular-nums">{(staff.allowance || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 tabular-nums text-red-600">{(staff.deduction || 0).toLocaleString()} {currency}</td>
                        <td className="border border-slate-300 p-2 font-black tabular-nums text-emerald-700 bg-emerald-50">
                          {netSalary.toLocaleString()} {currency}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-slate-600 pt-2">
                  أعطيت له هذه الشهادة بناءً على طلبه لتقديمها إلى الجهات المختصة دون أدنى مسؤولية مالية أو التزام تجاه المدرسة.
                </p>
              </div>
            )}

            {docType === "experience_cert" && (
              <div className="space-y-4 text-xs font-medium leading-relaxed text-slate-800">
                <p>تشهد إدارة المدرسة بأن الأستاذ/ة <strong className="text-slate-900">{staff.name}</strong> قد عمل/ت لدينا بوظيفة <strong className="text-primary">{staff.role}</strong> في {staff.department} من تاريخ {staff.hireDate || "2023/09/01"} وحتى تاريخه.</p>
                <p>وخلال فترة عمله/ا كان/ت مثالاً للموظف المتفاني والملتزم بأخلاقيات المهنة ورسالة التعليم، متمنين له/ا دوام التوفيق والنجاح.</p>
              </div>
            )}

            {docType === "clearance" && (
              <div className="space-y-4 text-xs font-medium leading-relaxed text-slate-800">
                <p>يفيد قسم الموارد البشرية وإدارة المستودعات بأن الموظف <strong className="text-slate-900">{staff.name}</strong> قد أتم تسليم كافة العهد المالية والمكتبية والأكاديمية المسندة إليه وليس في ذمته أي التزامات معلقة تجاه المدرسة.</p>
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="border border-slate-200 p-2 rounded-lg bg-slate-50">
                    <span className="block font-bold">العهدة المدرسية</span>
                    <span className="text-emerald-600 font-black">مخلى الطرف ✓</span>
                  </div>
                  <div className="border border-slate-200 p-2 rounded-lg bg-slate-50">
                    <span className="block font-bold">الحسابات والمالية</span>
                    <span className="text-emerald-600 font-black">مخلى الطرف ✓</span>
                  </div>
                  <div className="border border-slate-200 p-2 rounded-lg bg-slate-50">
                    <span className="block font-bold">المكتبة والمناهج</span>
                    <span className="text-emerald-600 font-black">مخلى الطرف ✓</span>
                  </div>
                </div>
              </div>
            )}

            {/* Official Signatures & Seal */}
            <div className="flex justify-between items-end pt-8 border-t border-slate-200 text-xs">
              <div className="text-center space-y-2">
                <span className="font-bold block">مسؤول الموارد البشرية</span>
                <span className="text-slate-400 font-serif">التوقيع: .....................</span>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 border-2 border-dashed border-primary/40 rounded-full mx-auto grid place-items-center text-primary/40 text-[9px] font-black uppercase">
                  ختم الإدارة المعتمد
                </div>
              </div>

              <div className="text-center space-y-2">
                <span className="font-bold block">مدير عام المدرسة</span>
                <span className="text-slate-400 font-serif">الاعتماد: .....................</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}

// =========================================================================
// 9. STAFF ADVANCE / LOAN MODAL (REQUEST SALARY ADVANCE)
// =========================================================================
export interface StaffAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  currency: string;
  onAddAdvance: (advanceData: any) => void;
}

export function StaffAdvanceModal({
  isOpen,
  onClose,
  staff,
  currency,
  onAddAdvance,
}: StaffAdvanceModalProps) {
  if (!isOpen || !staff) return null;

  const [amount, setAmount] = useState(1500);
  const [deductionMonth, setDeductionMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 7);
  });
  const [notes, setNotes] = useState("");

  const maxAllowed = Math.round((staff.basicSalary || 6000) * 0.7);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح للسلفة");
      return;
    }
    if (amount > maxAllowed) {
      toast.error(`المبلغ المطلوب يتجاوز الحد الأقصى المسموح به لهذا الموظف (${maxAllowed} ${currency})`);
      return;
    }

    onAddAdvance({
      staffId: staff.id,
      staffName: staff.name,
      amount,
      date: new Date().toISOString().split("T")[0],
      deductionMonth,
      deductFromPayrollDate: `${deductionMonth}-25`,
      status: "approved",
      notes: notes.trim() || undefined,
    });

    toast.success(`تم قيد طلب السلفة بمبلغ ${amount.toLocaleString()} ${currency} للموظف ${staff.name} وسيتم حسمها من مسير شهر ${deductionMonth}`);
    onClose();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="طلب وقيد سلفة مالية للموظف"
      description={`${staff.name} — الراتب الأساسي: ${staff.basicSalary?.toLocaleString() || 6000} ${currency}`}
      icon={Coins}
      tone="purple"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs font-bold text-muted-foreground">
            المتبقي من الراتب: <span className="font-black text-emerald-600 tabular-nums">{Math.max(0, (staff.basicSalary || 6000) - amount).toLocaleString()} {currency}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-input font-bold hover:bg-accent text-xs"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md hover:bg-primary/90 glow-primary transition-all"
            >
              اعتماد وصرف السلفة
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="mb-1 block font-bold text-foreground">مبلغ السلفة المطلوب ({currency}) *</label>
          <input
            type="number"
            required
            min={100}
            max={maxAllowed}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-black outline-none focus:border-primary tabular-nums"
          />
          <p className="mt-1 text-[10px] text-muted-foreground font-bold">
            الحد الأقصى المسموح به: {maxAllowed.toLocaleString()} {currency} (70% من الراتب الأساسي)
          </p>
        </div>

        <div>
          <label className="mb-1 block font-bold text-foreground">شهر الاستقطاع من الراتب *</label>
          <input
            type="month"
            required
            value={deductionMonth}
            onChange={(e) => setDeductionMonth(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block font-bold text-foreground">سبب أو ملاحظات طلب السلفة</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ظروف عائلية، علاج، طارئ..."
            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-bold outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="p-3 bg-muted/30 border border-border/70 rounded-xl flex items-center justify-between">
          <span className="font-bold text-muted-foreground">طريقة الصرف:</span>
          <span className="font-black text-foreground">تحويل بنكي / نقداً من الصندوق</span>
        </div>
      </form>
    </AdminModal>
  );
}
