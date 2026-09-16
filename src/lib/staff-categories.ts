import { 
  GraduationCap, 
  ShieldCheck, 
  DollarSign, 
  Bus, 
  Wrench, 
  Stethoscope, 
  Users 
} from "lucide-react";

export type StaffSector = 
  | "teaching"       // الهيئة التعليمية (معلمون، أساتذة، مربيات، محضري مختبرات)
  | "admin"          // الهيئة الإدارية والقيادية (مدراء، وكلاء، موجهين، سكرتارية، تسجيل)
  | "finance"        // الكادر المالي والمحاسبي (مدراء ماليين، محاسبين، أمناء صناديق)
  | "transport"      // كادر النقل والحركة (سائقين، مشرفي باصات، فنيي حركة)
  | "operations"     // الخدمات والصيانة والعمال (حراس أمن، عمال نظافة، فنيو صيانة، ضيافة)
  | "specialized";   // الكوادر الطبية والتقنية المساندة (أطباء، ممرضين، تقنية معلومات، مكتبات)

export interface StaffSectorMeta {
  id: StaffSector;
  label: string;
  shortLabel: string;
  badgeTone: "primary" | "success" | "warning" | "info" | "neutral";
  accentClass: string;
  bgLightClass: string;
  borderClass: string;
  icon: any;
  description: string;
}

export const STAFF_SECTOR_CONFIG: Record<StaffSector, StaffSectorMeta> = {
  teaching: {
    id: "teaching",
    label: "الهيئة التعليمية والتدريسية",
    shortLabel: "تعليمي وأكاديمي",
    badgeTone: "primary",
    accentClass: "text-primary dark:text-primary",
    bgLightClass: "bg-primary/10",
    borderClass: "border-primary/20",
    icon: GraduationCap,
    description: "المعلمون، الأساتذة، المربيات، ومحضرو المختبرات والمشرفون التربويون",
  },
  admin: {
    id: "admin",
    label: "الهيئة الإدارية والقيادية",
    shortLabel: "إداري وقيادي",
    badgeTone: "info",
    accentClass: "text-blue-600 dark:text-blue-400",
    bgLightClass: "bg-blue-500/10",
    borderClass: "border-blue-500/20",
    icon: ShieldCheck,
    description: "المدراء، الوكلاء، الموجهون الطلابيون، شؤون الطلاب، والقبول والتسجيل",
  },
  finance: {
    id: "finance",
    label: "الكادر المالي والمحاسبي",
    shortLabel: "مالي ومحاسبة",
    badgeTone: "success",
    accentClass: "text-emerald-600 dark:text-emerald-400",
    bgLightClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    icon: DollarSign,
    description: "المدراء الماليون، المحاسبون، أمناء الصناديق (كاشير)، ومسؤولو المشتريات",
  },
  transport: {
    id: "transport",
    label: "كادر النقل والحركة",
    shortLabel: "نقل وحركة",
    badgeTone: "warning",
    accentClass: "text-amber-600 dark:text-amber-400",
    bgLightClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    icon: Bus,
    description: "سائقو الحافلات المدرسية، مشرفو التوصيل، وفنيو صيانة أسطول النقل",
  },
  operations: {
    id: "operations",
    label: "الخدمات والصيانة والعمال",
    shortLabel: "خدمات وتشغيل",
    badgeTone: "neutral",
    accentClass: "text-slate-600 dark:text-slate-400",
    bgLightClass: "bg-slate-500/10",
    borderClass: "border-slate-500/20",
    icon: Wrench,
    description: "حراس الأمن والسلامة، عمال النظافة والتجهيز، فنيو التكييف والصيانة، وعمال الضيافة",
  },
  specialized: {
    id: "specialized",
    label: "الكوادر الطبية والتقنية المساندة",
    shortLabel: "مساند وطبي",
    badgeTone: "info",
    accentClass: "text-teal-600 dark:text-teal-400",
    bgLightClass: "bg-teal-500/10",
    borderClass: "border-teal-500/20",
    icon: Stethoscope,
    description: "أطباء وممرضو العيادة المدرسية، مسؤولو تقنية المعلومات، وأمناء المكتبات",
  },
};

export const STAFF_SECTOR_TABS = [
  { id: "all", label: "جميع العاملين", icon: Users },
  { id: "teaching", label: "الهيئة التعليمية", icon: GraduationCap },
  { id: "admin", label: "الهيئة الإدارية", icon: ShieldCheck },
  { id: "operations", label: "الخدمات والعمال", icon: Wrench },
  { id: "transport", label: "النقل والحركة", icon: Bus },
  { id: "finance", label: "الكادر المالي", icon: DollarSign },
  { id: "specialized", label: "الكوادر المساندة", icon: Stethoscope },
] as const;

/**
 * Intelligent categorization of staff member based on their role and department
 */
export function getStaffSector(staff: { role?: string; department?: string } | null | undefined): StaffSector {
  if (!staff) return "operations";

  const role = (staff.role || "").toLowerCase();
  const dept = (staff.department || "").toLowerCase();
  const combined = `${role} ${dept}`;

  // 1. Finance & Accounting Check
  if (
    combined.includes("مالي") ||
    combined.includes("محاسب") ||
    combined.includes("حسابات") ||
    combined.includes("كاشير") ||
    combined.includes("صندوق") ||
    combined.includes("خزينة") ||
    combined.includes("مشتريات") ||
    combined.includes("أجور") ||
    combined.includes("تدقيق مالي")
  ) {
    return "finance";
  }

  // 2. Transport & Fleet Check
  if (
    combined.includes("سائق") ||
    combined.includes("حافلة") ||
    combined.includes("باص") ||
    combined.includes("نقل") ||
    combined.includes("تراحيل") ||
    combined.includes("ميكانيكي") ||
    combined.includes("حركة")
  ) {
    return "transport";
  }

  // 3. Support, Maintenance, Security & Operations Check
  if (
    combined.includes("حارس") ||
    combined.includes("أمن") ||
    combined.includes("سلامة") ||
    combined.includes("نظافة") ||
    combined.includes("عامل") ||
    combined.includes("صيانة") ||
    combined.includes("تكييف") ||
    combined.includes("ضيافة") ||
    combined.includes("سفرة") ||
    combined.includes("مراسل") ||
    combined.includes("كهربائي") ||
    combined.includes("سباك")
  ) {
    return "operations";
  }

  // 4. Medical, IT & Specialized Check
  if (
    combined.includes("طبيب") ||
    combined.includes("طبيبة") ||
    combined.includes("عيادة") ||
    combined.includes("ممرض") ||
    combined.includes("تضميد") ||
    combined.includes("صحي") ||
    combined.includes("مكتبة") ||
    combined.includes("أمين مكتبة") ||
    combined.includes("تقنية معلومات") ||
    combined.includes("it") ||
    combined.includes("مسؤول تقنية") ||
    combined.includes("مهندس شبكات") ||
    combined.includes("نظم ومعلومات")
  ) {
    return "specialized";
  }

  // 5. Leadership & Administration Check
  if (
    combined.includes("مدير عام") ||
    combined.includes("مديرة عام") ||
    combined.includes("مدير المدرسة") ||
    combined.includes("مدير مرحلة") ||
    combined.includes("وكيل") ||
    combined.includes("وكيلة") ||
    combined.includes("إرشاد") ||
    combined.includes("موجه") ||
    combined.includes("مرشد") ||
    combined.includes("شؤون طلاب") ||
    combined.includes("قبول") ||
    combined.includes("تسجيل") ||
    combined.includes("سكرتير") ||
    combined.includes("سكرتارية") ||
    combined.includes("إدارة عامة") ||
    combined.includes("إشراف وإنضباط") ||
    combined.includes("مشرف دور")
  ) {
    return "admin";
  }

  // 6. Teaching & Faculty Check (Default for teachers and academic roles)
  if (
    combined.includes("معلم") ||
    combined.includes("معلمة") ||
    combined.includes("أستاذ") ||
    combined.includes("أستاذة") ||
    combined.includes("مدرس") ||
    combined.includes("مدرسة") ||
    combined.includes("مربي") ||
    combined.includes("مربية") ||
    combined.includes("أكاديم") ||
    combined.includes("صفوف أولية") ||
    combined.includes("رياض أطفال") ||
    combined.includes("محضر مختبر") ||
    combined.includes("فني معمل") ||
    combined.includes("مشرف تربوي") ||
    combined.includes("بدنية") ||
    combined.includes("فنية") ||
    combined.includes("رياضيات") ||
    combined.includes("علوم") ||
    combined.includes("فيزياء") ||
    combined.includes("كيمياء") ||
    combined.includes("أحياء") ||
    combined.includes("عربي") ||
    combined.includes("إنجليزي") ||
    combined.includes("إسلام") ||
    combined.includes("قرآن") ||
    combined.includes("حاسب")
  ) {
    return "teaching";
  }

  return "operations";
}

/**
 * Returns true strictly if staff belongs to the teaching faculty
 */
export function isTeachingStaff(staff: { role?: string; department?: string; [key: string]: any } | null | undefined): boolean {
  if (!staff) return false;
  return getStaffSector(staff) === "teaching";
}

/**
 * Universal ID matcher resolving differences between EA-EMP-xxxx, EMP-xxxx, and employeeNo
 */
export function matchesStaffId(
  staffOrId: { id?: string; employeeId?: string; employeeNo?: string; [key: string]: any } | string | null | undefined,
  candidateId: string | null | undefined
): boolean {
  if (!staffOrId || !candidateId) return false;

  const targetCandidate = String(candidateId).trim();
  const cleanCandidate = targetCandidate.replace(/^EA-/, "");

  if (typeof staffOrId === "string") {
    const rawTarget = staffOrId.trim();
    const cleanTarget = rawTarget.replace(/^EA-/, "");
    return (
      rawTarget === targetCandidate ||
      cleanTarget === cleanCandidate ||
      cleanTarget === targetCandidate ||
      rawTarget === cleanCandidate
    );
  }

  const staff = staffOrId;
  const staffId = staff.id ? String(staff.id).trim() : "";
  const cleanStaffId = staffId.replace(/^EA-/, "");
  const employeeId = staff.employeeId ? String(staff.employeeId).trim() : "";
  const cleanEmpId = employeeId.replace(/^EA-/, "");
  const employeeNo = staff.employeeNo ? String(staff.employeeNo).trim() : "";

  return (
    staffId === targetCandidate ||
    cleanStaffId === cleanCandidate ||
    cleanStaffId === targetCandidate ||
    staffId === cleanCandidate ||
    (employeeId !== "" && (employeeId === targetCandidate || cleanEmpId === cleanCandidate || cleanEmpId === targetCandidate)) ||
    (employeeNo !== "" && (employeeNo === targetCandidate || employeeNo === cleanCandidate))
  );
}

/**
 * Robust staff lookup in any array of staff members
 */
export function resolveStaffMember<T extends { id?: string; employeeId?: string; employeeNo?: string }>(
  staffList: T[],
  idOrNo: string | null | undefined
): T | undefined {
  if (!idOrNo || !Array.isArray(staffList)) return undefined;
  return staffList.find(s => matchesStaffId(s, idOrNo));
}
