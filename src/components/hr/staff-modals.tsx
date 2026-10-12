import React, { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users, Plus, Phone, Mail, Printer, Eye, Pencil, Trash2, X,
  AlertCircle, Briefcase, Layers, Sparkles, QrCode, ShieldCheck,
  ShieldAlert, KeyRound, Calendar, BookOpen, CheckCircle2,
  Copy, ExternalLink, RefreshCw, Building2, Award, Clock, ArrowRight,
  CreditCard, Check, AlertTriangle, UserCog, FileText, Send, Download,
  Coins, FileCheck, Shield, HelpCircle, UserCheck, UserX, MessageSquare,
  GraduationCap, Smartphone, ChevronRight, Lock, CheckSquare, Square
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
  allUsers?: any[];
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
  currentAcademicYearId,
  allUsers = []
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
  const [specialization, setSpecialization] = useState(initialData?.specialization || "");
  const [hireDate, setHireDate] = useState(initialData?.hireDate || new Date().toISOString().split("T")[0]);

  // Financial Info
  const [paymentType, setPaymentType] = useState<"Monthly" | "Weekly" | "PerLesson" | "Hourly" | "Daily">(initialData?.paymentType || "Monthly");
  const [basicSalary, setBasicSalary] = useState<number>(initialData?.basicSalary ?? 6000);
  const [housingAllowance, setHousingAllowance] = useState<number>(initialData?.housingAllowance ?? 0);
  const [transportAllowance, setTransportAllowance] = useState<number>(initialData?.transportAllowance ?? 0);
  const [otherAllowance, setOtherAllowance] = useState<number>(initialData?.allowance ?? 1000);
  const [deduction, setDeduction] = useState<number>(initialData?.deduction ?? 0);
  const [bankName, setBankName] = useState(initialData?.bankName || "مصرف الراجحي");
  const [iban, setIban] = useState(initialData?.iban || "");
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || "");

  // Find if already linked to user
  const existingUser = useMemo(() => {
    if (!initialData) return null;
    return allUsers.find(
      (u) =>
        (u.staffId && (u.staffId === initialData.id || u.staffId === initialData.employeeNo)) ||
        (u.email && initialData.email && u.email.trim().toLowerCase() === initialData.email.trim().toLowerCase()) ||
        (u.fullName && initialData.name && u.fullName.trim() === initialData.name.trim())
    ) || null;
  }, [initialData, allUsers]);

  // System User Account State
  const [createAccount, setCreateAccount] = useState(!isEditing || !existingUser);
  const [accountUsername, setAccountUsername] = useState(
    existingUser?.username ||
    (initialData?.employeeNo
      ? `emp_${initialData.employeeNo.toLowerCase().replace(/[^a-z0-9]/g, "")}`
      : "")
  );
  const [accountRole, setAccountRole] = useState(
    existingUser?.role ||
    (initialData?.role?.includes("معلم") ? "معلم" : initialData?.role?.includes("محاسب") ? "محاسب مالي" : "إداري")
  );
  const [accountPassword, setAccountPassword] = useState("Staff@2026");

  // Auto-generate employeeNo suggestion if empty
  const handleSuggestEmployeeNo = () => {
    const nextNumber = Math.floor(1000 + Math.random() * 9000);
    const suggested = `EMP-${nextNumber}`;
    setEmployeeNo(suggested);
    if (!accountUsername) {
      setAccountUsername(`emp_${nextNumber}`);
    }
    toast.success(`تم اقتراح الرقم الوظيفي: ${suggested}`);
  };

  // Quick Role Pills
  const commonRoles = [
    "معلم لغة عربية", "معلم رياضيات", "معلم علوم", "معلم لغة إنجليزية",
    "وكيل شؤون تعليمية", "وكيل شؤون طلاب", "محاسب مالي", "مشرف صحي",
    "مشرف نقل وحافلات", "أمين مكتبة", "حارس أمن", "سائق حافلة"
  ];

  // Auto-generate username when employeeNo changes
  const handleEmployeeNoChange = (val: string) => {
    setEmployeeNo(val);
    if (!isEditing && val) {
      const sanitized = val.toLowerCase().replace(/[^a-z0-9]/g, "");
      setAccountUsername(`emp_${sanitized}`);
    }
  };

  const totalAllowances = (Number(otherAllowance) || 0) + (Number(housingAllowance) || 0) + (Number(transportAllowance) || 0);

  const netSalary = useMemo(() => {
    return Math.max(0, (Number(basicSalary) || 0) + totalAllowances - (Number(deduction) || 0));
  }, [basicSalary, totalAllowances, deduction]);

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
      qualification,
      specialization: specialization.trim() || undefined,
      hireDate,
      phone: phone.trim() || undefined,
      emergencyPhone: emergencyPhone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      paymentType,
      basicSalary: Number(basicSalary) || 0,
      allowance: totalAllowances,
      housingAllowance: Number(housingAllowance) || 0,
      transportAllowance: Number(transportAllowance) || 0,
      deduction: Number(deduction) || 0,
      bankName,
      iban: iban.trim(),
      accountNumber: accountNumber.trim(),
      academicYearId: currentAcademicYearId,
    };

    onSave(payload, {
      shouldCreate: createAccount && !existingUser,
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
      title={isEditing ? `تعديل ملف الموظف: ${initialData?.name}` : "تسجيل موظف أو كادر مدرسي جديد"}
      description={isEditing ? "تحديث السجل الإداري والمالي ونظام الدخول المتكامل" : "إضافة موظف مع الربط اللحظي بمسير الأجور والصلاحيات"}
      icon={Users}
      tone="primary"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="text-xs text-muted-foreground font-bold">
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
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
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
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
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
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === "finance"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>الأجور والبدلات</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              activeTab === "account"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>حساب الدخول للنظام</span>
          </button>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-foreground">الرقم الوظيفي</label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleSuggestEmployeeNo}
                      className="text-[10px] text-primary hover:underline font-bold"
                    >
                      اقتراح تلقائي
                    </button>
                  )}
                </div>
                <input
                  value={employeeNo}
                  onChange={(e) => handleEmployeeNoChange(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold font-mono outline-none focus:border-primary text-left"
                  placeholder="EMP-1001"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">الهوية الوطنية / الإقامة</label>
                <input
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold font-mono outline-none focus:border-primary text-left"
                  placeholder="10XXXXXXXX"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-bold text-foreground">المسمى الوظيفي <span className="text-destructive">*</span></label>
              <input
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                placeholder="معلم رياضيات، مشرف، محاسب..."
              />
              {/* Quick Role Suggestions */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {commonRoles.slice(0, 6).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    + {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
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
                  <option value="العيادة المدرسية">العيادة المدرسية</option>
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
                <label className="mb-1 block font-bold text-foreground">التخصص الدقيق</label>
                <input
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                  placeholder="لغة عربية، فيزياء، إدارة..."
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">تاريخ المباشرة</label>
                <input
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                />
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

            <div className="grid gap-3.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-bold text-foreground">بدل السكن ({currency})</label>
                <input
                  type="number"
                  min={0}
                  value={housingAllowance}
                  onChange={(e) => setHousingAllowance(Number(e.target.value) || 0)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">بدل النقل / المواصلات ({currency})</label>
                <input
                  type="number"
                  min={0}
                  value={transportAllowance}
                  onChange={(e) => setTransportAllowance(Number(e.target.value) || 0)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">بدلات أخرى ({currency})</label>
                <input
                  type="number"
                  min={0}
                  value={otherAllowance}
                  onChange={(e) => setOtherAllowance(Number(e.target.value) || 0)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                />
              </div>
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

            {/* Net Salary Preview KPI */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-xs">صافي الراتب المستحق للصرف:</span>
                <span className="text-[11px] text-muted-foreground">الأساسي + البدلات ({totalAllowances.toLocaleString()}) - الاستقطاعات</span>
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
                  placeholder="مصرف الراجحي، بنك الرياض، بنكك..."
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
        {activeTab === "account" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {existingUser ? (
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-black">
                  <ShieldCheck className="h-5 w-5" />
                  <span>الموظف مرتبط بالفعل بحساب مستخدم مسجل:</span>
                </div>
                <div className="flex items-center justify-between pt-1 font-mono text-xs">
                  <span className="font-bold text-foreground">@{existingUser.username}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 font-bold">
                    الدور: {existingUser.role}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  يمكنك إدارة وتعديل كلمة المرور أو صلاحيات الحساب من نافذة "إدارة حساب الدخول" أو من قسم إدارة المستخدمين.
                </p>
              </div>
            ) : (
              <>
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
                        إنشاء حساب مستخدم للنظام لهذا الموظف
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
              </>
            )}
          </div>
        )}
      </div>
    </AdminModal>
  );
}

// =========================================================================
// 2. STAFF USER ACCOUNT MODAL (FULL CONTROL CENTER)
// =========================================================================
export interface StaffUserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  linkedUser: any | null;
  onLinkOrCreate: (userData: any) => void;
  onResetPassword?: (userId: string, newPassword: string) => void;
  onToggleUserStatus?: (userId: string, newStatus: "active" | "disabled") => void;
  onUpdateUserRole?: (userId: string, newRole: string) => void;
}

export function StaffUserAccountModal({
  isOpen,
  onClose,
  staff,
  linkedUser,
  onLinkOrCreate,
  onResetPassword,
  onToggleUserStatus,
  onUpdateUserRole
}: StaffUserAccountModalProps) {
  if (!isOpen || !staff) return null;

  const [username, setUsername] = useState(
    linkedUser?.username || `emp_${(staff.employeeNo || staff.id).toString().toLowerCase().replace(/[^a-z0-9]/g, "")}`
  );
  const [role, setAccountRole] = useState(
    linkedUser?.role || (staff.role?.includes("معلم") ? "معلم" : staff.role?.includes("محاسب") ? "محاسب مالي" : "إداري")
  );
  const [generatedPassword, setGeneratedPassword] = useState("Staff@2026");
  const [isCopied, setIsCopied] = useState(false);
  const [stageScope, setStageScope] = useState(linkedUser?.stageScope || staff.stage || "all");
  const [twoFactor, setTwoFactor] = useState(linkedUser?.twoFactorEnabled ?? false);

  const handleCopyCredentials = () => {
    const text = `بيانات الدخول إلى منصة المدرسة:\nالاسم: ${staff.name}\nاسم المستخدم: ${username}\nكلمة المرور: ${generatedPassword}\nالرابط: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success("تم نسخ بيانات الدخول إلى الحافظة");
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
      toast.success("تم تحديث وحفظ كلمة المرور الجديدة فوراً!");
    } else {
      toast.success("تم توليد كلمة مرور عشوائية");
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
      stageScope: stageScope || "all",
      twoFactorEnabled: twoFactor,
      password: generatedPassword,
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
      description={linkedUser ? "التحكم في الصلاحيات وحالة التفعيل وإعادة تعيين كلمة المرور" : "ربط الموظف بحساب مستخدم في النظام بصلاحيات مخصصة"}
      icon={KeyRound}
      tone="primary"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Link
            to="/admin/users"
            className="text-xs font-black text-primary hover:underline flex items-center gap-1"
          >
            الانتقال لمركز المستخدمين <ExternalLink className="h-3 w-3" />
          </Link>
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
      <div className="space-y-4">
        {linkedUser ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Status & User Info Header */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-foreground">@{linkedUser.username}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    linkedUser.status === "active" ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive"
                  }`}>
                    {linkedUser.status === "active" ? "حساب نشط" : "حساب معطل"}
                  </span>
                  {linkedUser.twoFactorEnabled && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-primary/10 text-primary">
                      2FA مفعل
                    </span>
                  )}
                </div>
                {onToggleUserStatus && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = linkedUser.status === "active" ? "disabled" : "active";
                      onToggleUserStatus(linkedUser.id, next);
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                      linkedUser.status === "active"
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                        : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20"
                    }`}
                  >
                    {linkedUser.status === "active" ? "تعطيل الحساب" : "تفعيل الحساب"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-border/70">
                <div>
                  <span className="text-muted-foreground font-bold">الدور الحالي: </span>
                  <span className="font-black text-primary">{linkedUser.role}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">نطاق المرحلة: </span>
                  <span className="font-bold">{linkedUser.stageScope === "all" ? "كافة المراحل" : linkedUser.stageScope || "عام"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">آخر تسجيل دخول: </span>
                  <span className="font-mono">{linkedUser.lastLogin || "لم يسجل بعد"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">تاريخ الإنشاء: </span>
                  <span className="font-mono">{linkedUser.createdAt || "غير محدد"}</span>
                </div>
              </div>
            </div>

            {/* Change Role Section */}
            {onUpdateUserRole && (
              <div className="p-3.5 rounded-2xl bg-card border border-border/70 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-foreground">تعديل الدور والصلاحيات:</span>
                <select
                  value={role}
                  onChange={(e) => {
                    const nextRole = e.target.value;
                    setAccountRole(nextRole);
                    onUpdateUserRole(linkedUser.id, nextRole);
                    toast.success(`تم تغيير دور المستخدم إلى: ${nextRole}`);
                  }}
                  className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="معلم">معلم</option>
                  <option value="إداري">إداري</option>
                  <option value="مشرف أكاديمي">مشرف أكاديمي</option>
                  <option value="محاسب مالي">محاسب مالي</option>
                  <option value="أمين تسجيل">أمين تسجيل</option>
                  <option value="مدير مدرسة">مدير مدرسة</option>
                </select>
              </div>
            )}

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
                    toast.success("تم نسخ كلمة المرور");
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
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-foreground">اسم المستخدم <span className="text-destructive">*</span></label>
                <input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold font-mono outline-none focus:border-primary text-left"
                  dir="ltr"
                  placeholder="emp_user"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">الدور والصلاحيات <span className="text-destructive">*</span></label>
                <select
                  value={role}
                  onChange={(e) => setAccountRole(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="معلم">معلم</option>
                  <option value="إداري">إداري</option>
                  <option value="مشرف أكاديمي">مشرف أكاديمي</option>
                  <option value="محاسب مالي">محاسب مالي</option>
                  <option value="أمين تسجيل">أمين تسجيل</option>
                  <option value="مدير مدرسة">مدير مدرسة</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-foreground">المرحلة الدراسية المخصصة</label>
                <select
                  value={stageScope}
                  onChange={(e) => setStageScope(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="all">كافة المراحل</option>
                  <option value="primary">المرحلة الابتدائية</option>
                  <option value="middle">المرحلة المتوسطة</option>
                  <option value="secondary">المرحلة الثانوية</option>
                  <option value="kindergarten">مرحلة رياض الأطفال</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-foreground">كلمة المرور الابتدائية</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] text-primary hover:underline font-bold"
                  >
                    توليد عشوائي
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
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-foreground block">تفعيل التحقق الثنائي (2FA)</span>
                <span className="text-[11px] text-muted-foreground">مطالبة الموظف برمز تأكيد عند تسجيل الدخول</span>
              </div>
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => setTwoFactor(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all glow-primary"
            >
              إنشاء واعتماد حساب المستخدم
            </button>
          </form>
        )}
      </div>
    </AdminModal>
  );
}

// =========================================================================
// 3. STAFF QUICK LEAVE REGISTRATION MODAL
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
  const [type, setType] = useState<"annual" | "sick" | "emergency" | "unpaid" | "maternity" | "study" | "issued">("annual");
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
        {/* Leave Balance Banner */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
            <Clock className="h-4 w-4" />
            <span>رصيد الإجازات السنوية المستحق:</span>
          </div>
          <span className="font-black text-sm text-amber-700 dark:text-amber-400">21 يوم سنوياً</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-bold text-foreground">نوع الإجازة</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
            >
              <option value="annual">إجازة اعتيادية سنوية</option>
              <option value="sick">إجازة مرضية (بتقرير طبي)</option>
              <option value="emergency">إجازة اضطرارية طارئة</option>
              <option value="unpaid">إجازة استثنائية بدون راتب</option>
              <option value="maternity">إجازة أمومة / رعاية مولود</option>
              <option value="study">إجازة دراسية واختبارات</option>
              <option value="issued">إذن خروج واستئذان جزئي</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-bold text-foreground">الموظف البديل المكلف</label>
            <select
              value={replacementId}
              onChange={(e) => setReplacementId(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
            >
              <option value="">-- اختياري: بدون بديل محدد --</option>
              {allStaff
                .filter((s) => s.id !== staff.id && s.status === "active")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-bold text-foreground">تاريخ بداية الإجازة</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-foreground">تاريخ نهاية الإجازة</label>
            <input
              type="date"
              required
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-bold text-foreground">سبب الإجازة وملاحظات</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-bold outline-none focus:border-primary resize-none"
            placeholder="ملاحظات توثيقية إضافية..."
          />
        </div>

        <div className="p-3 rounded-2xl bg-muted/30 border border-border/70 flex items-center justify-between">
          <div>
            <span className="font-bold text-xs text-foreground block">تحديث حالة الموظف التلقائي</span>
            <span className="text-[11px] text-muted-foreground">تحويل حالة الموظف في النظام إلى "في إجازة" طوال فترة الإجازة</span>
          </div>
          <input
            type="checkbox"
            checked={syncStatus}
            onChange={(e) => setSyncStatus(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
        </div>
      </form>
    </AdminModal>
  );
}

// =========================================================================
// 4. STAFF TEACHING ASSIGNMENTS MODAL
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
            <span className={`font-black tabular-nums ${totalPeriods > 24 ? "text-destructive" : totalPeriods >= 20 ? "text-amber-600" : "text-primary"}`}>
              {totalPeriods} / 24 حصة
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                totalPeriods > 24 ? "bg-destructive" : totalPeriods >= 20 ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, (totalPeriods / 24) * 100)}%` }}
            />
          </div>
          {totalPeriods > 24 && (
            <div className="flex items-center gap-1.5 text-[11px] text-destructive font-bold">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>تنبيه: المعلم يتجاوز النصاب الأقصى المعتمد للحصص الدراسية.</span>
            </div>
          )}
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
                    <div>
                      <span className="font-black text-foreground block">{sub?.name || "مادة غير محددة"}</span>
                      <span className="text-[11px] text-muted-foreground font-bold">
                        {sec ? `${sec.grade} - ${sec.name}` : "شعبة غير محددة"} • {a.periodsPerWeek || 4} حصص أسبوعياً
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteAssignment(a.id)}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      title="حذف هذا الإسناد"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Assignment Form */}
        <form onSubmit={handleAdd} className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-3">
          <span className="font-black text-foreground block">إسناد مادة وفصل جديد</span>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block font-bold text-foreground">المادة الدراسية</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                <option value="">-- اختر المادة --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-foreground">الشعبة / الصف</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
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
                max={10}
                value={periodsPerWeek}
                onChange={(e) => setPeriodsPerWeek(Number(e.target.value) || 4)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-black outline-none focus:border-primary tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="h-9 px-5 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> إضافة الإسناد
            </button>
          </div>
        </form>
      </div>
    </AdminModal>
  );
}

// =========================================================================
// 5. STAFF QUICK PREVIEW MODAL
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
  onToggleStatus?: () => void;
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
  onToggleStatus,
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

          <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
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

            {onToggleStatus && (
              <button
                type="button"
                onClick={onToggleStatus}
                className="text-[10px] font-bold text-primary hover:underline ms-2"
              >
                تبديل الحالة
              </button>
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
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono" dir="ltr">{staff.phone || "غير مسجل"}</span>
              {staff.phone && (
                <a
                  href={`tel:${staff.phone}`}
                  className="text-primary hover:text-primary/80"
                  title="اتصال"
                >
                  <Phone className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-bold">البريد الإلكتروني:</span>
            <span className="font-bold font-mono" dir="ltr">{staff.email || "غير مسجل"}</span>
          </div>
          {staff.iban && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-bold">الحساب البنكي (IBAN):</span>
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
            <div className="w-full max-w-[320px] mx-auto rounded-3xl border-2 border-primary/30 bg-card p-5 shadow-xl text-center space-y-3 relative overflow-hidden print:border-none print:shadow-none">
              <div className="absolute top-0 left-0 right-0 h-2 bg-primary" />

              <span className="font-black text-xs text-foreground block pt-1">تعليمات وتعريف الهوية المدرسية</span>

              <div className="text-[10px] text-muted-foreground font-bold leading-relaxed space-y-1.5 text-right bg-muted/30 p-3 rounded-xl border border-border/60">
                <p>• هذه البطاقة وثيقة رسمية صادرة عن إدارة المدرسة ويجب إبرازها أثناء الدوام الرسمي.</p>
                <p>• يُرجى إبلاغ قسم شؤون الموظفين فور فقدان هذه البطاقة.</p>
                <p>• في حال العثور على البطاقة، يُرجى تسليمها لإدارة المدرسة أو التواصل مع إدارة الأمن والسلامة.</p>
              </div>

              {staff.emergencyPhone && (
                <div className="text-[10px] font-bold text-foreground bg-muted/40 p-2 rounded-xl">
                  هاتف الطوارئ: <span className="font-mono font-bold" dir="ltr">{staff.emergencyPhone}</span>
                </div>
              )}

              {/* Barcode Mock */}
              <div className="pt-2">
                <div className="h-8 bg-foreground/15 rounded flex items-center justify-around px-2 font-mono text-[9px] tracking-widest text-muted-foreground">
                  ||| | | |||| | ||| |||| | | ||
                </div>
                <span className="text-[9px] font-mono text-muted-foreground block mt-1">SN: {empCode}-SEC-2026</span>
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
// 8. STAFF OFFICIAL DOCUMENTS MODAL (5 OFFICIAL DOCUMENTS)
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

  const [docType, setDocType] = useState<"salary_cert" | "experience_cert" | "clearance" | "mission_letter" | "contract_renewal">("salary_cert");
  const [recipient, setRecipient] = useState("إلى من يهمه الأمر");
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
        <div className="border-b border-border/70 flex gap-2 pb-1 overflow-x-auto custom-scrollbar print:hidden">
          <button
            type="button"
            onClick={() => setDocType("salary_cert")}
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              docType === "salary_cert" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>شهادة تعريف بالراتب</span>
          </button>
          <button
            type="button"
            onClick={() => setDocType("experience_cert")}
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              docType === "experience_cert" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>شهادة خبرة وخدمة</span>
          </button>
          <button
            type="button"
            onClick={() => setDocType("clearance")}
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              docType === "clearance" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>إخلاء طرف وتسليم عهد</span>
          </button>
          <button
            type="button"
            onClick={() => setDocType("mission_letter")}
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              docType === "mission_letter" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>خطاب تكليف بمهمة</span>
          </button>
          <button
            type="button"
            onClick={() => setDocType("contract_renewal")}
            className={`pb-2 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
              docType === "contract_renewal" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>إشعار تجديد عقد</span>
          </button>
        </div>

        {/* Recipient Input (print:hidden) */}
        <div className="flex items-center gap-3 print:hidden">
          <label className="text-xs font-bold text-foreground shrink-0">الجهة الموجه إليها الخطاب:</label>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="h-9 flex-1 rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
            placeholder="إلى من يهمه الأمر، مصرف الراجحي، السفارة..."
          />
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

            {/* Recipient Salutation */}
            <div className="text-slate-800 font-bold text-xs">
              السادة / {recipient} <span className="font-normal me-2">المحترمين</span>
              <div className="text-slate-600 font-normal mt-0.5">السلام عليكم ورحمة الله وبركاته،، وبعد:</div>
            </div>

            {/* Document Title */}
            <div className="text-center py-2">
              <span className="inline-block border-b-2 border-primary pb-1 text-sm font-black text-slate-900">
                {docType === "salary_cert" && "شهادة تعريف وتفصيل الراتب الرسمي"}
                {docType === "experience_cert" && "شهادة خبرة وبيان مدة الخدمة"}
                {docType === "clearance" && "نموذج إخلاء طرف وتسليم العهد"}
                {docType === "mission_letter" && "خطاب تكليف بمهمة رسمية"}
                {docType === "contract_renewal" && "إشعار رسمي بتجديد العقد الوظيفي"}
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

            {docType === "mission_letter" && (
              <div className="space-y-4 text-xs font-medium leading-relaxed text-slate-800">
                <p>تفيد إدارة المدرسة بتكليف الموظف المذكور أعلاه بأداء مهمة إدارية وميدانية رسمية لصالح المدرسة، نرجو من كافة الجهات المعنية تقديم التسهيلات اللازمة لإنجاح مهمته.</p>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1">
                  <div><strong>الموظف المكلف:</strong> {staff.name} ({staff.role})</div>
                  <div><strong>القسم:</strong> {staff.department}</div>
                  <div><strong>الفترة المحددة:</strong> أسبوع من تاريخ إصدار الخطاب</div>
                </div>
              </div>
            )}

            {docType === "contract_renewal" && (
              <div className="space-y-4 text-xs font-medium leading-relaxed text-slate-800">
                <p>يسر إدارة المدرسة إشعاركم بقرار تجديد عقد العمل الخاص بكم للعام الدراسي القادم بنفس المزايا والشروط المعتمدة، تقديراً لجهودكم المتميزة في خدمة رسالتنا التعليمية.</p>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1">
                  <div><strong>الموظف:</strong> {staff.name}</div>
                  <div><strong>الوظيفة:</strong> {staff.role}</div>
                  <div><strong>الراتب الصافي المعتمد:</strong> {netSalary.toLocaleString()} {currency}</div>
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
// 9. STAFF ADVANCE / LOAN REQUEST MODAL
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
  const [installmentsCount, setInstallmentsCount] = useState<1 | 2 | 3>(1);
  const [notes, setNotes] = useState("");

  const maxAllowed = Math.round((staff.basicSalary || 6000) * 0.7);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح للسلفة");
      return;
    }
    if (amount > maxAllowed) {
      toast.error(`المبلغ المطلوب يتجاوز الحد الأقصى المسموح به لهذا الموظف (${maxAllowed.toLocaleString()} ${currency})`);
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
      installments: installmentsCount,
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
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-foreground">مبلغ السلفة المطلوب ({currency}) *</label>
            <span className="text-[10px] text-muted-foreground font-bold">
              الحد الأقصى المسموح (70%): <span className="font-black text-primary">{maxAllowed.toLocaleString()} {currency}</span>
            </span>
          </div>
          <input
            type="number"
            required
            min={100}
            max={maxAllowed}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-black outline-none focus:border-primary tabular-nums"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-bold text-foreground">شهر بداية الخصم من الراتب</label>
            <input
              type="month"
              required
              value={deductionMonth}
              onChange={(e) => setDeductionMonth(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-foreground">تقسيط السلفة</label>
            <select
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(Number(e.target.value) as any)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
            >
              <option value={1}>دفعة واحدة (كامل المبلغ)</option>
              <option value={2}>قسطين شهريين ({(amount / 2).toLocaleString()} شهرياً)</option>
              <option value={3}>3 أقساط شهرية ({(amount / 3).toLocaleString()} شهرياً)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block font-bold text-foreground">السبب / ملاحظات الصرف</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-bold outline-none focus:border-primary resize-none"
            placeholder="سلفة طارئة، ظرف عائلي، مصاريف علاج..."
          />
        </div>
      </form>
    </AdminModal>
  );
}
