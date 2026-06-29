import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { EducationalStage, useStage } from "./StageContext";

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  relation: string;
  address?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface EnrollmentRecord {
  id: string;
  academicYearId: string;
  grade: string;
  status: "ناجح" | "راسب" | "منقول" | "خريج";
  date: string;
}

export interface Student {
  id: string;
  name: string;
  dob: string;
  nationalId: string;
  guardianName: string;
  stage: EducationalStage;
  grade: string;
  
  // New Detailed Info
  gender?: "ذكر" | "أنثى";
  sectionId?: string; // Links to Section
  address?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  bloodType?: string;
  medicalNotes?: string;
  enrollmentDate?: string;
  academicYearId?: string;
  status?: "نشط" | "موقوف" | "منقول" | "خريج" | "راسب";
  enrollmentHistory?: EnrollmentRecord[];
  major?: "science" | "literature";
  pickupPersons?: string;
  specialCare?: boolean;
  elective?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "١٤٤٥ / ١٤٤٦ هـ"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface TeachingAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  sectionId: string;
  yearId: string;
  stage: EducationalStage;
}

export interface KindergartenStudent extends Student {
  stage: "kindergarten";
  pickupPersons: string;
  allergies: string;
  specialCare: boolean;
}

export interface HighSchoolStudent extends Student {
  stage: "high";
  major: "science" | "literature";
  elective: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string; 
  title?: string;
  amount: number;
  discountId?: string;
  discountAmount?: number;
  netAmount?: number;
  paid: number;
  dueDate: string;
  issueDate?: string;
  status: "paid" | "partial" | "unpaid" | "cancelled";
  stage: EducationalStage;
}

export interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  type: string;
  stage: EducationalStage | "all";
  grades?: string[];
  sections?: string[];
  isMandatory: boolean;
}

export interface Discount {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  description?: string;
  isActive?: boolean;
  stage?: EducationalStage | "all";
  grades?: string[];
  sections?: string[];
  studentIds?: string[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  date: string;
  method: "cash" | "bank_transfer" | "card" | "cheque";
  referenceNo?: string;
  notes?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  categoryId: string;
  beneficiary: string;
  method: "cash" | "bank_transfer" | "card" | "cheque";
  referenceNo?: string;
  notes?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  copies: number;
  available: number;
  stage: EducationalStage;
}

export interface LibraryIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  dueDate: string;
  status: "active" | "returned" | "overdue";
  stage: EducationalStage;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: string;
  status: "available" | "low_stock" | "out_of_stock";
}

export interface InventoryTransaction {
  id: string;
  type: "issue" | "receive";
  itemId: string;
  itemName: string;
  quantity: number;
  date: string;
  by: string;
  to: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "active" | "on_leave" | "terminated";
  stage: EducationalStage | "all"; // some staff serve specific stages, some all
  employeeNo?: string;
  phone?: string;
  email?: string;
  subjects?: string[];
  sections?: string[];
  isDeleted?: boolean;
  deletedAt?: string;
  basicSalary?: number;
  allowance?: number;
  deduction?: number;
}

export interface ClinicVisit {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  actionTaken: string;
  stage: EducationalStage;
}

export interface DisciplineIncident {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  type: "positive" | "negative";
  category: string;
  points: number;
  description: string;
  stage: EducationalStage;
}

export interface Section {
  id: string;
  name: string;
  grade: string;
  capacity: number;
  stage: EducationalStage;
  homeroomTeacher?: string;
}

export interface ScheduleSlot {
  id: string;
  sectionId: string;
  day: string;
  period: number;
  subjectId: string;
  teacherId: string;
  stage: EducationalStage;
}

export interface ExamType {
  id: string;
  name: string;
  weight: number;
  stage: EducationalStage | "all";
  subjectId?: string; // Optional: If provided, this exam type is specific to a single subject
}

export interface Exam {
  id: string;
  subjectId: string;
  typeId: string;
  term: string;
  date: string;
  totalMarks: number;
  stage: EducationalStage;
  grade?: string;
  sectionId?: string;
}

export interface ExamMark {
  id: string;
  examId: string;
  studentId: string;
  subjectId: string;
  mark: number;
  notes?: string;
  stage: EducationalStage;
}

export interface ExamCategory {
  id: string;
  name: string;
  weight: number;
  grades?: string[];
  gradingSystem: string;
  maxMark: number;
  color: string;
  stage: EducationalStage | "all";
}

export interface ScheduledExam {
  id: string;
  name: string;
  grade: string;
  sectionId: string;
  categoryId?: string;
  subjectId: string;
  term: string;
  date: string;
  totalMarks: number;
  gradingSystem: string;
  status: string;
  classId: string;
  stage: string;
}

export interface ExamGrade {
  id: string;
  examId: string;
  studentId: string;
  mark: number;
  notes?: string;
  descriptiveGrade?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  stage: EducationalStage | "all";
  grades?: string[]; // Array of grades this subject is taught in
  fee?: number; // Optional fee associated with the subject (e.g. lab fee)
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  priority: "high" | "medium" | "low";
  status: "new" | "in_progress" | "completed";
  costEstimate?: number;
  dateRequested: string;
  dateCompleted?: string;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: string;
  type: "classroom" | "lab" | "office" | "hall";
  capacity: number;
  status: "available" | "occupied" | "maintenance";
}

export interface StaffEvaluation {
  id: string;
  staffId: string;
  staffName: string;
  period: string;
  evaluator: string;
  date: string;
  criteria: {
    commitment: number;
    performance: number;
    cooperation: number;
    creativity: number;
  };
  overallScore: number;
  notes?: string;
}

export interface StaffContract {
  id: string;
  staffId: string;
  staffName: string;
  type: "full_time" | "part_time" | "contractor";
  startDate: string;
  endDate: string;
  basicSalary: number;
  status: "active" | "expired" | "renewing";
}

export interface StaffLeave {
  id: string;
  staffId: string;
  staffName: string;
  type: "annual" | "sick" | "unpaid" | "emergency";
  startDate: string;
  endDate: string;
  days: number;
  status: "pending" | "approved" | "rejected";
  notes?: string;
}

export interface StaffAttendanceRecord {
  id?: string;
  staffId: string;
  date: string;
  status: "present" | "late" | "absent" | "excused";
  checkIn?: string;
  checkOut?: string;
  minutesLate?: number;
  deductionAmount?: number;
  notes?: string;
}

export interface StaffAdvance {
  id: string;
  staffId: string;
  staffName: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "rejected" | "paid";
  notes?: string;
  deductFromPayrollDate?: string;
  deductionMonth?: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  entity: string;
  details: string;
  date: string;
  ip?: string;
}

export interface Textbook {
  id: string;
  title: string;
  subject: string;
  gradeId: string;
  term?: string;
  copies: number;
  stage: string;
}

export interface TextbookDistribution {
  id: string;
  textbookId: string;
  studentId: string;
  date: string;
  status: string;
  stage: string;
}

export interface TransportRoute {
  id: string;
  name: string;
  destination: string;
  driverName: string;
  driverPhone: string;
  supervisorName: string;
  vehiclePlate: string;
  capacity: number;
  stops: number;
  feeAmount: number;
  feeMode: "annual" | "term" | "monthly";
}

export interface TransportSubscription {
  id: string;
  studentId: string;
  routeId: string;
  direction: string;
  status: string;
  fee?: number;
}

export interface TimetableSettings {
  maxPeriodsPerDay: number;
  breakDuration: number;
  periodDuration: number;
  stage: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "danger";
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface SystemSettings {
  schoolName: string;
  licenseNumber: string;
  phone: string;
  email: string;
  address: string;
  principalName: string;
  vision: string;
  roomCategories: string;
  assetCategories: string;
  roomNumbering: string;
  maintenanceAlert: string;
  inventoryAlertLimit: number;
  inventoryMethod: string;
  winterTime: string;
  summerTime: string;
  lateAsPartialAbsence: boolean;
  deductBehaviorOnAbsence: boolean;
  taxNumber: string;
  vatRate: number;
  refundPolicy: string;
  autoTransferPayroll: boolean;
  autoMaintenanceExpense: boolean;
  autoLibraryFee: boolean;
  annualLeaveDays: number;
  lateDeductionRate: number;
  gracePeriod: boolean;
  fingerprintSync: boolean;
  admissionStatus: string;
  maxClassSize: number;
  reqBirthCert: boolean;
  reqVaccine: boolean;
  reqPrevCert: boolean;
  reqFamilyCard: boolean;
  whatsappApiToken?: string;
  smsProvider?: string;
  googleWorkspace?: boolean;
  microsoftTeams?: boolean;
  moodleIntegration?: boolean;
  zoomIntegration?: boolean;
  paymentGateway?: string;
  stripePubKey?: string;
  stripeSecretKey?: string;
  paytabsProfileId?: string;
  paytabsServerKey?: string;
  footerText: string;
  defaultTemplate: string;
  rowsPerBatch: string;
  qrCodeUsage: string;
  headerEntity: string;
  headerDepartment: string;
  qrVerifyUrl: string;
  qrExpiry: string;
  qrIncludeId: boolean;
  themeMode: "light" | "dark" | "system";
  primaryColor: string;
  language: "ar" | "en";
  dateFormat: string;
  defaultChannels: { email: boolean; sms: boolean; push: boolean };
  mobileLoginPolicy: string;
  notifSync: string;
  parentViewLimit: boolean;
  teacherViewLimit: boolean;
  hideFinancial: boolean;
  logMobileActivity: boolean;
  apiKey: string;
  webhookUrl: string;
  whStudentCreated: boolean;
  whInvoicePaid: boolean;
  whExamUpdated: boolean;
  whTransportChanged: boolean;
  apiRateLimit: number;
  apiAccessScope: string;
  apiAllowedIps: string;
  passwordPolicy: string;
  sessionTimeout: string;
  force2FA: boolean;
  lockAfter5Fails: boolean;
}

export const defaultSettings: SystemSettings = {
  schoolName: "مدرسة النموذج الأهلية",
  licenseNumber: "LIC-2024-001",
  phone: "0112345678",
  email: "info@school.edu",
  address: "الرياض - حي الواحة",
  principalName: "خالد القحطاني",
  vision: "الريادة في التعليم وصناعة جيل واعٍ مبتكر",
  roomCategories: "فصل دراسي,معمل,مكتبة,صالة رياضية,مسرح,قاعة اجتماعات",
  assetCategories: "أثاث مدرسي,أجهزة إلكترونية,معدات رياضية,كتب ومراجع,أخرى",
  roomNumbering: "ترقيم تلقائي (RM-XXXX)",
  maintenanceAlert: "مفعل (قبل 7 أيام)",
  inventoryAlertLimit: 10,
  inventoryMethod: "FIFO (ما يدخل أولاً يخرج أولاً)",
  winterTime: "07:30",
  summerTime: "06:45",
  lateAsPartialAbsence: true,
  deductBehaviorOnAbsence: true,
  taxNumber: "300012345600003",
  vatRate: 15,
  refundPolicy: "خلال 14 يوم من التسجيل",
  autoTransferPayroll: true,
  autoMaintenanceExpense: true,
  autoLibraryFee: true,
  annualLeaveDays: 30,
  lateDeductionRate: 2,
  gracePeriod: true,
  fingerprintSync: true,
  admissionStatus: "مفتوح للتسجيل الإلكتروني",
  maxClassSize: 25,
  reqBirthCert: true,
  reqVaccine: true,
  reqPrevCert: true,
  reqFamilyCard: true,
  footerText: "هذه الوثيقة معتمدة ومستخرجة من نظام مدارس الإلكتروني",
  defaultTemplate: "جدول مضغوط مع تكرار الترويسة",
  rowsPerBatch: "60 صف",
  qrCodeUsage: "مفعل لكل الشهادات والفواتير",
  headerEntity: "وزارة التربية والتعليم",
  headerDepartment: "الإدارة التعليمية",
  qrVerifyUrl: "https://school.example.sd/verify",
  qrExpiry: "سنة كاملة",
  qrIncludeId: true,
  themeMode: "system",
  primaryColor: "#0ea5e9",
  language: "ar",
  dateFormat: "DD/MM/YYYY",
  defaultChannels: { email: true, sms: false, push: true },
  mobileLoginPolicy: "رمز OTP عبر SMS أو WhatsApp",
  notifSync: "لحظي للغياب والفواتير والدرجات",
  parentViewLimit: true,
  teacherViewLimit: true,
  hideFinancial: true,
  logMobileActivity: true,
  apiKey: "sk_live_school_1A2B3C4D",
  webhookUrl: "https://example.com/school-webhook",
  whStudentCreated: true,
  whInvoicePaid: true,
  whExamUpdated: true,
  whTransportChanged: true,
  apiRateLimit: 120,
  apiAccessScope: "قراءة وكتابة حسب الصلاحيات",
  apiAllowedIps: "",
  passwordPolicy: "معقدة (حروف، أرقام، رموز)",
  sessionTimeout: "بعد 30 دقيقة من الخمول",
  force2FA: true,
  lockAfter5Fails: true,
  paymentGateway: "none",
};
// --- Initial Mock Data ---
const initialStudents: Student[] = [
  { id: "STU-1001", name: "أحمد محمد محمود", dob: "2015-05-12", nationalId: "1029384756", guardianName: "محمد محمود", stage: "primary", grade: "الصف الأول الابتدائي", sectionId: "SEC-1001", gender: "ذكر", status: "نشط", bloodType: "O+", guardianPhone: "0501234567" },
  { id: "STU-1002", name: "سارة خالد العتيبي", dob: "2018-02-15", nationalId: "1098765432", guardianName: "خالد العتيبي", stage: "kindergarten", grade: "روضة 2", gender: "أنثى", status: "نشط", bloodType: "A+", medicalNotes: "حساسية من الفول السوداني", guardianPhone: "0559876543" },
  { id: "STU-1003", name: "عمر فهد العتيبي", dob: "2008-09-10", nationalId: "1002003004", guardianName: "فهد العتيبي", stage: "high", grade: "الصف الأول الثانوي", major: "science", elective: "حاسب آلي" }
];

const initialInvoices: Invoice[] = [
  { id: "INV-1001", studentId: "STU-1001", studentName: "أحمد محمد محمود", title: "الرسوم الدراسية - القسط الأول", amount: 5000, netAmount: 5000, discountAmount: 0, paid: 5000, issueDate: "2023-08-01", dueDate: "2023-09-01", status: "paid", stage: "primary" },
  { id: "INV-1002", studentId: "STU-1002", studentName: "سارة خالد العتيبي", title: "الرسوم الدراسية - القسط الأول", amount: 6000, netAmount: 6000, discountAmount: 0, paid: 3000, issueDate: "2023-08-01", dueDate: "2023-09-01", status: "partial", stage: "kindergarten" },
  { id: "INV-1003", studentId: "STU-1003", studentName: "عمر فهد العتيبي", title: "الرسوم الدراسية - القسط الأول", amount: 8000, netAmount: 8000, discountAmount: 0, paid: 0, issueDate: "2023-09-01", dueDate: "2023-10-01", status: "unpaid", stage: "high" },
];

const initialFeeStructures: FeeStructure[] = [
  { id: "FEE-001", name: "الرسوم الدراسية - ابتدائي", amount: 15000, type: "tuition", stage: "primary", isMandatory: true },
  { id: "FEE-002", name: "الرسوم الدراسية - متوسط", amount: 18000, type: "tuition", stage: "middle", isMandatory: true },
  { id: "FEE-003", name: "رسوم النقل (اتجاهين)", amount: 3000, type: "transport", stage: "all", isMandatory: false },
  { id: "FEE-004", name: "رسوم التسجيل", amount: 1000, type: "registration", stage: "all", isMandatory: true },
];

const initialDiscounts: Discount[] = [
  { id: "DIS-001", name: "خصم الإخوة", type: "percentage", value: 10, description: "يخصم 10% للأخ الثاني فما فوق" },
  { id: "DIS-002", name: "خصم أبناء المعلمين", type: "percentage", value: 25, description: "يخصم 25% من الرسوم الدراسية لأبناء العاملين" },
  { id: "DIS-003", name: "منحة تفوق", type: "fixed", value: 5000, description: "خصم مقطوع للطلاب الأوائل" },
];

const initialPayments: Payment[] = [
  { id: "PAY-001", invoiceId: "INV-1001", studentId: "STU-1001", amount: 5000, date: "2023-08-15", method: "bank_transfer", referenceNo: "TRX-98765" },
  { id: "PAY-002", invoiceId: "INV-1002", studentId: "STU-1002", amount: 3000, date: "2023-08-20", method: "cash" },
];

const initialExpenseCategories: ExpenseCategory[] = [
  { id: "EXPCAT-1", name: "رواتب الموظفين والمعلمين" },
  { id: "EXPCAT-2", name: "إيجارات" },
  { id: "EXPCAT-3", name: "فواتير الكهرباء والمياه" },
  { id: "EXPCAT-4", name: "صيانة وتطوير" },
  { id: "EXPCAT-5", name: "أدوات وقرطاسية" },
];

const initialExpenses: Expense[] = [
  { id: "EXP-001", title: "فاتورة الكهرباء - أغسطس", amount: 4500, date: "2023-09-02", categoryId: "EXPCAT-3", beneficiary: "شركة الكهرباء", method: "bank_transfer" },
  { id: "EXP-002", title: "صيانة أجهزة التكييف", amount: 2000, date: "2023-09-10", categoryId: "EXPCAT-4", beneficiary: "مؤسسة الصيانة", method: "cash" },
];

const initialBooks: Book[] = [
  { id: "B-1001", title: "تاريخ الأمم والملوك", author: "الطبري", category: "تاريخ", copies: 5, available: 3, stage: "high" },
  { id: "B-1002", title: "مقدمة ابن خلدون", author: "ابن خلدون", category: "علم اجتماع", copies: 3, available: 0, stage: "high" },
  { id: "B-1003", title: "قصص الأنبياء للأطفال", author: "ابن كثير", category: "تاريخ", copies: 10, available: 8, stage: "primary" },
  { id: "B-1004", title: "ألوان وحروف", author: "وزارة التعليم", category: "مناهج", copies: 20, available: 20, stage: "kindergarten" },
];

const initialLibraryIssues: LibraryIssue[] = [
  { id: "IS-001", bookId: "B-1002", bookTitle: "مقدمة ابن خلدون", studentId: "STU-1003", studentName: "عمر فهد العتيبي", issueDate: "2023-10-01", dueDate: "2023-10-15", status: "active", stage: "high" },
];

const initialInventoryItems: InventoryItem[] = [
  { id: "ITM-001", name: "زي مدرسي مقاس S", category: "زي مدرسي", quantity: 150, price: "120 {currency}", status: "available" },
  { id: "ITM-002", name: "حزمة كتب الصف الأول الثانوي", category: "كتب ومقررات", quantity: 10, price: "350 {currency}", status: "low_stock" },
  { id: "ITM-003", name: "ألوان خشبية", category: "قرطاسية", quantity: 0, price: "15 {currency}", status: "out_of_stock" },
];

const initialInventoryTransactions: InventoryTransaction[] = [
  { id: "TRX-001", type: "issue", itemId: "ITM-002", itemName: "حزمة كتب الصف الأول الثانوي", quantity: 1, to: "عمر فهد العتيبي", date: "2023-10-10", by: "أمين المستودع" },
];

const initialStaff: Staff[] = [
  { id: "EMP-1001", name: "خالد عبدالرحمن", role: "معلم رياضيات", department: "الشؤون الأكاديمية", status: "active", stage: "high", basicSalary: 8500, allowance: 1500, deduction: 0 },
  { id: "EMP-1002", name: "منيرة الدوسري", role: "مربية أطفال", department: "رياض الأطفال", status: "active", stage: "kindergarten", basicSalary: 6000, allowance: 1000, deduction: 300 },
  { id: "EMP-1004", name: "أحمد المعلم", role: "معلم صف", department: "الصفوف الأولية", status: "active", stage: "primary", basicSalary: 7500, allowance: 1200, deduction: 0 },
  { id: "EMP-1005", name: "فاطمة الزهراء", role: "معلم علوم", department: "العلوم", status: "active", stage: "middle", basicSalary: 8000, allowance: 1000, deduction: 100 },
  { id: "EMP-1003", name: "سالم المري", role: "حارس أمن", department: "الخدمات العامة", status: "active", stage: "all", basicSalary: 4000, allowance: 500, deduction: 0 },
];

const initialClinicVisits: ClinicVisit[] = [
  { id: "CV-001", studentId: "STU-1002", studentName: "سارة خالد السعيد", date: "2023-10-15", symptoms: "ارتفاع في درجة الحرارة", diagnosis: "حمى خفيفة", actionTaken: "إعطاء خافض حرارة والاتصال بولي الأمر", stage: "kindergarten" }
];

const initialDiscipline: DisciplineIncident[] = [
  { id: "DI-001", studentId: "STU-1003", studentName: "عمر فهد العتيبي", date: "2023-10-12", type: "negative", category: "تأخر صباحي", points: -2, description: "تأخر عن الطابور الصباحي", stage: "high" },
  { id: "DI-002", studentId: "STU-1001", studentName: "أحمد محمد محمود", date: "2023-10-14", type: "positive", category: "مشاركة متميزة", points: 5, description: "حل مسألة صعبة في الإذاعة המدرسية", stage: "primary" }
];

const initialSections: Section[] = [
  { id: "SEC-101", name: "أ", grade: "الصف الأول", capacity: 25, stage: "primary" },
  { id: "SEC-102", name: "ب", grade: "الصف الأول", capacity: 25, stage: "primary" },
  { id: "SEC-103", name: "أ", grade: "الصف الثاني", capacity: 25, stage: "primary" },
  { id: "SEC-104", name: "أ", grade: "الصف الثالث", capacity: 25, stage: "primary" },
  { id: "SEC-105", name: "أ", grade: "الصف الرابع", capacity: 25, stage: "primary" },
  { id: "SEC-201", name: "أ", grade: "الصف الأول المتوسط", capacity: 25, stage: "middle" },
  { id: "SEC-301", name: "1", grade: "الصف الأول الثانوي", capacity: 30, stage: "high" },
];

const initialScheduleSlots: ScheduleSlot[] = [];

const initialExamTypes: ExamType[] = [
  { id: "EXT-001", name: "اختبار قصير", weight: 10, stage: "all" },
  { id: "EXT-002", name: "اختبار نصفي", weight: 30, stage: "all" },
  { id: "EXT-003", name: "اختبار نهائي", weight: 60, stage: "all" },
];

const initialExams: Exam[] = [
  { id: "EX-1001", subjectId: "SUB-2", typeId: "EXT-002", term: "الفصل الأول", date: "2023-11-15", totalMarks: 30, stage: "primary", grade: "الصف الأول الابتدائي" },
  { id: "EX-1002", subjectId: "SUB-3", typeId: "EXT-003", term: "الفصل الأول", date: "2023-12-20", totalMarks: 50, stage: "high" },
];

const initialExamMarks: ExamMark[] = [
  { id: "EM-1001", examId: "EX-1001", studentId: "STU-1001", subjectId: "SUB-2", mark: 28, stage: "primary" }
];

const initialSubjects: Subject[] = [
  { id: "SUB-101", name: "الرياضيات", code: "MATH101", creditHours: 5, stage: "primary", grades: ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع", "الصف الخامس", "الصف السادس"] },
  { id: "SUB-102", name: "العلوم", code: "SCI101", creditHours: 4, stage: "primary", grades: ["الصف الرابع", "الصف الخامس", "الصف السادس"], fee: 500 },
  { id: "SUB-103", name: "اللغة العربية", code: "ARAB101", creditHours: 6, stage: "primary", grades: ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع", "الصف الخامس", "الصف السادس"] },
  { id: "SUB-104", name: "القرآن الكريم", code: "ISL101", creditHours: 3, stage: "all" },
  { id: "SUB-105", name: "الفيزياء", code: "PHY101", creditHours: 4, stage: "high", grades: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"], fee: 800 },
  { id: "SUB-106", name: "الكيمياء", code: "CHEM101", creditHours: 4, stage: "high", grades: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"], fee: 800 },
  { id: "SUB-107", name: "لغتي الجميلة", code: "ARAB100", creditHours: 5, stage: "primary", grades: ["الصف الأول", "الصف الثاني", "الصف الثالث"] },
];

const initialAcademicYears: AcademicYear[] = [
  { id: "Y-1001", name: "١٤٤٥ هـ", startDate: "2023-08-20", endDate: "2024-06-10", isCurrent: false },
  { id: "Y-1002", name: "١٤٤٦ هـ", startDate: "2024-08-18", endDate: "2025-06-15", isCurrent: true },
];

const initialTeachingAssignments: TeachingAssignment[] = [];

const initialMaintenanceRequests: MaintenanceRequest[] = [
  { id: "MR-1001", title: "إصلاح مكيف", description: "مكيف معطل في المعمل", location: "معمل الحاسب", priority: "high", status: "new", costEstimate: 500, dateRequested: "2023-10-20" }
];
const initialRooms: Room[] = [
  { id: "RM-101", name: "المعمل الرئيسي", building: "المبنى أ", floor: "الأول", type: "lab", capacity: 30, status: "available" }
];
const initialStaffEvaluations: StaffEvaluation[] = [
  { id: "SE-1001", staffId: "EMP-1001", staffName: "خالد عبدالرحمن", period: "الفصل الأول", evaluator: "المدير", date: "2023-11-01", criteria: { commitment: 5, performance: 4, cooperation: 5, creativity: 4 }, overallScore: 4.5, notes: "أداء ممتاز" }
];
const initialStaffContracts: StaffContract[] = [
  { id: "SC-1001", staffId: "EMP-1001", staffName: "خالد عبدالرحمن", type: "full_time", startDate: "2022-08-01", endDate: "2024-08-01", basicSalary: 8500, status: "active" }
];
const initialStaffLeaves: StaffLeave[] = [
  { id: "SL-1001", staffId: "EMP-1001", staffName: "خالد عبدالرحمن", type: "sick", startDate: "2023-10-15", endDate: "2023-10-16", days: 2, status: "approved" }
];
const initialActivityLogs: ActivityLog[] = [
  { id: "AL-1001", user: "أحمد العتيبي", action: "تسجيل دخول", entity: "النظام", details: "نجاح تسجيل الدخول", date: "2023-10-20T08:00:00Z" }
];

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  role: string;
  status: "active" | "disabled";
  lastLogin: string;
}

const initialUsers: UserAccount[] = [
  { id: "U-1001", username: "admin", fullName: "أحمد العتيبي", role: "مدير عام", status: "active", lastLogin: "2026-06-13 09:42" },
  { id: "U-1002", username: "principal01", fullName: "خالد القحطاني", role: "مدير مدرسة", status: "active", lastLogin: "2026-06-13 08:01" },
  { id: "U-1003", username: "registrar01", fullName: "نوال الزهراني", role: "أمين تسجيل", status: "active", lastLogin: "2026-06-12 14:22" },
  { id: "U-1004", username: "t.mona", fullName: "منى الزهراني", role: "معلم", status: "active", lastLogin: "2026-06-13 07:11" },
  { id: "U-1005", username: "g.saad", fullName: "سعد الحربي", role: "ولي أمر", status: "disabled", lastLogin: "2026-05-30 20:30" },
];

// --- Context ---
interface GlobalStoreContextType {
  // All Data
  allStudents: Student[];
  allDeletedStudents: Student[];
  allInvoices: Invoice[];
  allFeeStructures: FeeStructure[];
  allDiscounts: Discount[];
  allPayments: Payment[];
  allExpenses: Expense[];
  allExpenseCategories: ExpenseCategory[];
  allBooks: Book[];
  allLibraryIssues: LibraryIssue[];
  allInventoryItems: InventoryItem[];
  allInventoryTransactions: InventoryTransaction[];
  allStaff: Staff[];
  allClinicVisits: ClinicVisit[];
  allDisciplineIncidents: DisciplineIncident[];
  allSections: Section[];
  allExams: Exam[];
  allExamMarks: ExamMark[];
  allExamTypes: ExamType[];
  allSubjects: Subject[];
  allScheduleSlots: ScheduleSlot[];
  allAcademicYears: AcademicYear[];
  allTeachingAssignments: TeachingAssignment[];
  allScheduledExams: ScheduledExam[];
  allExamCategories: ExamCategory[];
  allExamGrades: ExamGrade[];
  
  allMaintenanceRequests: MaintenanceRequest[];
  allRooms: Room[];
  allStaffEvaluations: StaffEvaluation[];
  allStaffContracts: StaffContract[];
  allStaffLeaves: StaffLeave[];
  allStaffAttendance: StaffAttendanceRecord[];
  allStaffAdvances: StaffAdvance[];
  allActivityLogs: ActivityLog[];
  allUsers: UserAccount[];
  
  // Filtered by Active Stage
  activeStageStudents: Student[];
  activeStageInvoices: Invoice[];
  activeStageFeeStructures: FeeStructure[];
  activeStageBooks: Book[];
  activeStageLibraryIssues: LibraryIssue[];
  activeStageStaff: Staff[];
  activeStageStaffAttendance: StaffAttendanceRecord[];
  activeStageClinicVisits: ClinicVisit[];
  activeStageDisciplineIncidents: DisciplineIncident[];
  activeStageSections: Section[];
  activeStageExams: Exam[];
  activeStageExamMarks: ExamMark[];
  activeStageExamTypes: ExamType[];
  activeStageSubjects: Subject[];
  activeStageScheduleSlots: ScheduleSlot[];
  activeStageTeachingAssignments: TeachingAssignment[];
  activeStageScheduledExams: ScheduledExam[];
  activeStageExamCategories: ExamCategory[];
  activeStageExamGrades: ExamGrade[];

  // Actions
  addStudent: (student: Omit<Student, "id">) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  softDeleteStudent: (id: string) => void;
  restoreStudent: (id: string) => void;
  hardDeleteStudent: (id: string) => void;
  addGuardian: (g: Omit<Guardian, "id">) => void;
  updateGuardian: (id: string, updates: Partial<Guardian>) => void;
  softDeleteGuardian: (id: string) => void;
  restoreGuardian: (id: string) => void;
  hardDeleteGuardian: (id: string) => void;
  restoreItem: (type: 'student' | 'guardian' | 'staff', id: string) => void;
  hardDeleteItem: (type: 'student' | 'guardian' | 'staff', id: string) => void;
  
  // Finance methods
  addInvoice: (invoiceData: Omit<Invoice, "id" | "paid" | "status">) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addFeeStructure: (feeData: Omit<FeeStructure, "id">) => void;
  updateFeeStructure: (id: string, updates: Partial<FeeStructure>) => void;
  deleteFeeStructure: (id: string) => void;
  addDiscount: (discountData: Omit<Discount, "id">) => void;
  updateDiscount: (id: string, updates: Partial<Discount>) => void;
  deleteDiscount: (id: string) => void;
  addPayment: (invoiceId: string, amount: number, method: string, referenceNo?: string) => void;
  addExpense: (expenseData: Omit<Expense, "id">) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addBook: (book: Omit<Book, "id" | "available">) => void;
  issueBook: (bookId: string, studentId: string) => void;
  returnBook: (issueId: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, "id" | "status">) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  processInventoryTransaction: (transaction: Omit<InventoryTransaction, "id" | "date" | "itemName">) => void;
  addStaff: (staff: Omit<Staff, "id">) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  upsertStaffAttendance: (record: StaffAttendanceRecord) => void;
  addStaffAdvance: (record: Omit<StaffAdvance, "id">) => void;
  addClinicVisit: (visit: Omit<ClinicVisit, "id" | "studentName" | "stage">) => void;
  addDisciplineIncident: (incident: Omit<DisciplineIncident, "id" | "studentName" | "stage">) => void;
  addSection: (section: Omit<Section, "id">) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  deleteSection: (id: string) => void;
  
  currency: string;
  setCurrency: (c: string) => void;
  
  examGradingMode: "marks" | "percentage";
  setExamGradingMode: (mode: "marks" | "percentage") => void;
  addExamType: (type: Omit<ExamType, "id">) => void;
  updateExamType: (id: string, updates: Partial<ExamType>) => void;
  deleteExamType: (id: string) => void;
  
  addExam: (exam: Omit<Exam, "id">) => void;
  deleteExam: (id: string) => void;
  saveExamMarks: (marks: Omit<ExamMark, "id">[]) => void;
  saveExamGrades: (grades: Omit<ExamGrade, "id">[]) => void;
  
  addScheduledExam: (exam: Omit<ScheduledExam, "id" | "createdAt">) => void;
  updateScheduledExam: (id: string, updates: Partial<ScheduledExam>) => void;
  deleteScheduledExam: (id: string) => void;

  addExamCategory: (cat: Omit<ExamCategory, "id">) => void;
  deleteExamCategory: (id: string) => void;

  addSubject: (subject: Omit<Subject, "id">) => void;
  deleteSubject: (id: string) => void;
  updateScheduleSlot: (slot: Omit<ScheduleSlot, "id">) => void;
  clearScheduleSlot: (sectionId: string, day: string, period: number) => void;
  addAcademicYear: (year: Omit<AcademicYear, "id">) => void;
  updateAcademicYear: (id: string, updates: Partial<AcademicYear>) => void;
  addTeachingAssignment: (assignment: Omit<TeachingAssignment, "id">) => void;
  deleteTeachingAssignment: (id: string) => void;
  assignStudentToSection: (studentId: string, sectionId?: string) => void;
  promoteStudents: (promotions: { studentId: string; nextGrade: string; nextAcademicYearId: string; status: "ناجح" | "راسب" | "منقول" | "خريج" }[]) => void;
  generateBulkData: (count: number) => void;

  addMaintenanceRequest: (req: Omit<MaintenanceRequest, "id">) => void;
  updateMaintenanceRequest: (id: string, updates: Partial<MaintenanceRequest>) => void;
  undoMaintenanceRequest: (id: string) => void;
  deleteMaintenanceRequest: (id: string) => void;

  addRoom: (room: Omit<Room, "id">) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;

  addStaffEvaluation: (evalData: Omit<StaffEvaluation, "id">) => void;
  addStaffContract: (contractData: Omit<StaffContract, "id">) => void;
  addStaffLeave: (leaveData: Omit<StaffLeave, "id">) => void;
  updateStaffLeave: (id: string, updates: Partial<StaffLeave>) => void;

  addActivityLog: (logData: Omit<ActivityLog, "id" | "date">) => void;

  // User Account Management
  addUser: (userData: Omit<UserAccount, "id">) => void;
  updateUser: (id: string, updates: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;

  allGuardians: Guardian[];

  // Library Distribution
  allTextbooks: Textbook[];
  allTextbookDistributions: TextbookDistribution[];
  activeStageTextbooks: Textbook[];
  activeStageDistributions: TextbookDistribution[];
  addTextbook: (tb: Omit<Textbook, "id">) => void;
  updateTextbook: (id: string, updates: Partial<Textbook>) => void;
  deleteTextbook: (id: string) => void;
  distributeTextbook: (distribution: Omit<TextbookDistribution, "id" | "date" | "status">) => void;
  removeDistribution: (id: string) => void;

  // Transport
  transportRoutes: TransportRoute[];
  transportSubscriptions: TransportSubscription[];
  addTransportRoute: (r: Omit<TransportRoute, "id">) => void;
  updateTransportRoute: (id: string, updates: Partial<TransportRoute>) => void;
  deleteTransportRoute: (id: string) => void;
  addTransportSubscription: (s: Omit<TransportSubscription, "id">) => void;
  updateTransportSubscription: (id: string, updates: Partial<TransportSubscription>) => void;
  deleteTransportSubscription: (id: string) => void;

  // Timetable
  activeStageTimetableSettings: TimetableSettings;
  updateTimetableSettings: (updates: Partial<TimetableSettings>) => void;

  systemSettings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
}

const GlobalStoreContext = createContext<GlobalStoreContextType | undefined>(undefined);

export function GlobalStoreProvider({ children }: { children: ReactNode }) {
  const { stage: activeStage } = useStage();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [deletedStudents, setDeletedStudents] = useState<Student[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(initialFeeStructures);
  const [discounts, setDiscounts] = useState<Discount[]>(initialDiscounts);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [expenseCategories] = useState<ExpenseCategory[]>(initialExpenseCategories);
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [libraryIssues, setLibraryIssues] = useState<LibraryIssue[]>(initialLibraryIssues);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventoryItems);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(initialInventoryTransactions);
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [clinicVisits, setClinicVisits] = useState<ClinicVisit[]>(initialClinicVisits);
  const [disciplineIncidents, setDisciplineIncidents] = useState<DisciplineIncident[]>(initialDiscipline);
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [examMarks, setExamMarks] = useState<ExamMark[]>(initialExamMarks);
  const [examTypes, setExamTypes] = useState<ExamType[]>(initialExamTypes);
  const [examGradingMode, setExamGradingMode] = useState<"marks" | "percentage">("marks");
  const [currency, setCurrency] = useState(() => {
    try {
      const saved = localStorage.getItem("darasi_currency");
      return saved || "ج.س";
    } catch {
      return "ج.س";
    }
  });
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(initialScheduleSlots);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(initialAcademicYears);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>(initialTeachingAssignments);

  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(initialMaintenanceRequests);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [staffEvaluations, setStaffEvaluations] = useState<StaffEvaluation[]>(initialStaffEvaluations);
  const [staffContracts, setStaffContracts] = useState<StaffContract[]>(initialStaffContracts);
  const [staffLeaves, setStaffLeaves] = useState<StaffLeave[]>(initialStaffLeaves);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendanceRecord[]>([]);
  const [staffAdvances, setStaffAdvances] = useState<StaffAdvance[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [users, setUsers] = useState<UserAccount[]>(initialUsers);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "notif-1",
      title: "تنبيه: ميزانية تجاوزت الحد",
      message: "الرجاء مراجعة قسم المالية فوراً.",
      type: "danger",
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      read: false
    },
    {
      id: "notif-2",
      title: "تم تسجيل ١٠ طلاب جدد",
      message: "في مرحلة رياض الأطفال.",
      type: "success",
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      read: false
    }
  ]);

  const unreadNotificationsCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const markAllNotificationsAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const deleteNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const addNotification = (n: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    setNotifications(prev => [{
      ...n,
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    }, ...prev]);
  };

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem("darasi_system_settings");
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    }
    return defaultSettings;
  });
  
  useEffect(() => {
    localStorage.setItem("darasi_system_settings", JSON.stringify(systemSettings));
  }, [systemSettings]);

  useEffect(() => {
    localStorage.setItem("darasi_currency", currency);
  }, [currency]);
  
  const updateSettings = (updates: Partial<SystemSettings>) => {
    setSystemSettings(prev => ({ ...prev, ...updates }));
  };

  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [textbookDistributions, setTextbookDistributions] = useState<TextbookDistribution[]>([]);

  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>([]);
  const [transportSubscriptions, setTransportSubscriptions] = useState<TransportSubscription[]>([]);

  const [scheduledExams, setScheduledExams] = useState<ScheduledExam[]>([]);
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([]);
  const [examGrades, setExamGrades] = useState<ExamGrade[]>([]);

  const [timetableSettings, setTimetableSettings] = useState<TimetableSettings>({
    maxPeriodsPerDay: 7,
    breakDuration: 45,
    periodDuration: 45,
    stage: "all"
  });

  // Derived state filtered by the global active stage
  const activeStageStudents = useMemo(() => students.filter(s => s.stage === activeStage), [students, activeStage]);
  const allDeletedStudents = useMemo(() => students.filter(s => s.isDeleted), [students]);
  const activeStageInvoices = useMemo(() => invoices.filter(inv => inv.stage === activeStage), [invoices, activeStage]);
  const activeStageFeeStructures = useMemo(() => feeStructures.filter(f => f.stage === "all" || f.stage === activeStage), [feeStructures, activeStage]);
  const activeStageBooks = useMemo(() => books.filter(b => b.stage === activeStage), [books, activeStage]);
  const activeStageLibraryIssues = useMemo(() => libraryIssues.filter(li => li.stage === activeStage), [libraryIssues, activeStage]);
  const activeStageStaff = useMemo(() => staff.filter(st => st.stage === activeStage || st.stage === "all"), [staff, activeStage]);
  const activeStageStaffAttendance = useMemo(() => staffAttendance.filter(sa => activeStageStaff.some(s => s.id === sa.staffId)), [staffAttendance, activeStageStaff]);
  const activeStageClinicVisits = useMemo(() => clinicVisits.filter(cv => cv.stage === activeStage), [clinicVisits, activeStage]);
  const activeStageDisciplineIncidents = useMemo(() => disciplineIncidents.filter(di => di.stage === activeStage), [disciplineIncidents, activeStage]);
  const activeStageSections = useMemo(() => sections.filter(sec => sec.stage === activeStage), [sections, activeStage]);
  const activeStageExams = useMemo(() => exams.filter(ex => ex.stage === activeStage), [exams, activeStage]);
  const activeStageExamMarks = useMemo(() => examMarks.filter(em => em.stage === activeStage), [examMarks, activeStage]);
  const activeStageExamTypes = useMemo(() => examTypes.filter(et => et.stage === activeStage || et.stage === "all"), [examTypes, activeStage]);
  const activeStageSubjects = useMemo(() => subjects.filter(sub => sub.stage === activeStage || sub.stage === "all"), [subjects, activeStage]);
  const activeStageScheduleSlots = useMemo(() => scheduleSlots.filter(s => s.stage === activeStage), [scheduleSlots, activeStage]);
  const activeStageTeachingAssignments = useMemo(() => teachingAssignments.filter(ta => ta.stage === activeStage), [teachingAssignments, activeStage]);

  const activeStageScheduledExams = useMemo(() => scheduledExams.filter(e => e.stage === activeStage), [scheduledExams, activeStage]);
  const activeStageExamCategories = useMemo(() => examCategories.filter(c => c.stage === activeStage), [examCategories, activeStage]);
  const activeStageExamGrades = useMemo(() => examGrades.filter(g => {
    const ex = scheduledExams.find(e => e.id === g.examId);
    return ex?.stage === activeStage;
  }), [examGrades, scheduledExams, activeStage]);

  const activeStageTextbooks = useMemo(() => textbooks.filter(t => t.stage === activeStage), [textbooks, activeStage]);
  const activeStageDistributions = useMemo(() => textbookDistributions.filter(d => d.stage === activeStage), [textbookDistributions, activeStage]);
  const activeStageTimetableSettings = useMemo(() => timetableSettings.stage === activeStage || timetableSettings.stage === "all" ? timetableSettings : timetableSettings, [timetableSettings, activeStage]);

  // --- Actions ---
  const addStudent = (studentData: Omit<Student, "id">) => {
    const newStudentId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent = { ...studentData, id: newStudentId } as Student;
    setStudents((prev) => [newStudent, ...prev]);

    // Calculate tuition base
    const tuitionAmount = newStudent.stage === "kindergarten" ? 6000 : newStudent.stage === "primary" ? 5000 : newStudent.stage === "middle" ? 6500 : 8000;
    
    // Calculate additional fees from subjects
    const applicableSubjects = subjects.filter(sub => 
      (sub.stage === "all" || sub.stage === newStudent.stage) && 
      (!sub.grades || sub.grades.length === 0 || sub.grades.includes(newStudent.grade))
    );
    const subjectFees = applicableSubjects.reduce((acc, curr) => acc + (curr.fee || 0), 0);
    
    const totalAmount = tuitionAmount + subjectFees;

    const newInvoice: Invoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: newStudentId, 
      studentName: newStudent.name, 
      amount: totalAmount, 
      netAmount: totalAmount, 
      discountAmount: 0, 
      paid: 0,
      dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0],
      status: "unpaid", 
      stage: newStudent.stage, 
      issueDate: new Date().toISOString().split('T')[0], 
      title: subjectFees > 0 ? "الرسوم الدراسية ورسوم المواد" : "الرسوم الدراسية"
    };
    setInvoices((prev) => [newInvoice, ...prev]);
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const softDeleteStudent = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isDeleted: true, deletedAt: new Date().toISOString() } : s));
  };

  const restoreStudent = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isDeleted: false, deletedAt: undefined } : s));
  };

  const hardDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const addGuardian = (g: Omit<Guardian, "id">) => {
    setGuardians(prev => [...prev, { ...g, id: `G-${Math.floor(1000 + Math.random() * 9000)}` }]);
  };

  const updateGuardian = (id: string, updates: Partial<Guardian>) => {
    setGuardians(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const softDeleteGuardian = (id: string) => {
    setGuardians(prev => prev.map(g => g.id === id ? { ...g, isDeleted: true, deletedAt: new Date().toISOString() } : g));
  };

  const restoreGuardian = (id: string) => {
    setGuardians(prev => prev.map(g => g.id === id ? { ...g, isDeleted: false, deletedAt: undefined } : g));
  };

  const hardDeleteGuardian = (id: string) => {
    setGuardians(prev => prev.filter(g => g.id !== id));
  };

  const assignStudentToSection = (studentId: string, sectionId?: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, sectionId } : s));
  };

  const promoteStudents = (promotions: { studentId: string; nextGrade: string; nextAcademicYearId: string; status: "ناجح" | "راسب" | "منقول" | "خريج" }[]) => {
    setStudents(prev => {
      const updated = [...prev];
      promotions.forEach(promo => {
        const idx = updated.findIndex(s => s.id === promo.studentId);
        if (idx > -1) {
          const student = updated[idx];
          const newHistory = [...(student.enrollmentHistory || [])];
          
          if (student.academicYearId && student.grade) {
            newHistory.push({
              id: `enr-${Math.random().toString(36).substr(2, 9)}`,
              academicYearId: student.academicYearId,
              grade: student.grade,
              status: promo.status,
              date: new Date().toISOString()
            });
          }

          updated[idx] = {
            ...student,
            grade: promo.nextGrade,
            academicYearId: promo.nextAcademicYearId,
            status: promo.status === "خريج" ? "خريج" : "نشط",
            enrollmentHistory: newHistory
          };
        }
      });
      return updated;
    });
  };

  // --- Finance Methods ---
  const addInvoice = (invoiceData: Omit<Invoice, "id" | "paid" | "status">) => {
    setInvoices(prev => [{
      ...invoiceData,
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      paid: 0,
      status: "unpaid"
    }, ...prev]);
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        const updated = { ...inv, ...updates };
        if (updated.paid >= (updated.netAmount || updated.amount)) {
          updated.status = "paid";
        } else if (updated.paid > 0) {
          updated.status = "partial";
        } else {
          updated.status = "unpaid";
        }
        return updated;
      }
      return inv;
    }));
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    // Optionally delete associated payments
    setPayments(prev => prev.filter(p => p.invoiceId !== id));
  };

  const addFeeStructure = (feeData: Omit<FeeStructure, "id">) => setFeeStructures(prev => [{ ...feeData, id: `FEE-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  const updateFeeStructure = (id: string, updates: Partial<FeeStructure>) => setFeeStructures(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  const deleteFeeStructure = (id: string) => setFeeStructures(prev => prev.filter(f => f.id !== id));

  const addDiscount = (discountData: Omit<Discount, "id">) => setDiscounts(prev => [{ ...discountData, id: `DIS-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  const updateDiscount = (id: string, updates: Partial<Discount>) => setDiscounts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  const deleteDiscount = (id: string) => setDiscounts(prev => prev.filter(d => d.id !== id));

  const addExpense = (expenseData: Omit<Expense, "id">) => setExpenses(prev => [{ ...expenseData, id: `EXP-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  const updateExpense = (id: string, updates: Partial<Expense>) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  const deleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));

  const addPayment = (invoiceId: string, amount: number, method: string = "cash", referenceNo?: string) => {
    const paymentId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    const payment: Payment = {
      id: paymentId,
      invoiceId,
      studentId: invoices.find(i => i.id === invoiceId)?.studentId || "",
      amount,
      date: new Date().toISOString().split("T")[0],
      method: method as any,
      referenceNo
    };
    
    setPayments(prev => [payment, ...prev]);

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newPaid = inv.paid + amount;
          const targetAmount = inv.netAmount ?? inv.amount;
          return {
            ...inv,
            paid: newPaid,
            status: newPaid >= targetAmount ? "paid" : newPaid > 0 ? "partial" : "unpaid",
          };
        }
        return inv;
      })
    );
  };

  const addBook = (bookData: Omit<Book, "id" | "available">) => {
    const newBook: Book = { ...bookData, id: `B-${Math.floor(1000 + Math.random() * 9000)}`, available: bookData.copies };
    setBooks(prev => [newBook, ...prev]);
  };

  const issueBook = (bookId: string, studentId: string) => {
    const book = books.find(b => b.id === bookId);
    const student = students.find(s => s.id === studentId);
    if (!book || !student || book.available <= 0) return;

    const newIssue: LibraryIssue = {
      id: `IS-${Math.floor(1000 + Math.random() * 9000)}`,
      bookId, bookTitle: book.title, studentId, studentName: student.name,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split("T")[0],
      status: "active", stage: student.stage,
    };
    setLibraryIssues(prev => [newIssue, ...prev]);
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, available: b.available - 1 } : b));
  };

  const returnBook = (issueId: string) => {
    setLibraryIssues(prev => prev.map(issue => {
      if (issue.id === issueId && issue.status !== "returned") {
        setBooks(booksPrev => booksPrev.map(b => b.id === issue.bookId ? { ...b, available: b.available + 1 } : b));
        return { ...issue, status: "returned" };
      }
      return issue;
    }));
  };

  const addInventoryItem = (itemData: Omit<InventoryItem, "id" | "status">) => {
    const newItem: InventoryItem = {
      ...itemData, id: `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
      status: itemData.quantity === 0 ? "out_of_stock" : itemData.quantity <= 10 ? "low_stock" : "available",
    };
    setInventoryItems(prev => [newItem, ...prev]);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventoryItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteInventoryItem = (id: string) => {
    setInventoryItems(prev => prev.filter(item => item.id !== id));
  };

  const processInventoryTransaction = (txn: Omit<InventoryTransaction, "id" | "date" | "itemName">) => {
    const item = inventoryItems.find(i => i.id === txn.itemId);
    if (!item) return;

    if (txn.type === "issue" && item.quantity < txn.quantity) throw new Error("Insufficient stock");

    const newTxn: InventoryTransaction = {
      ...txn, id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`, itemName: item.name, date: new Date().toISOString().split("T")[0],
    };

    setInventoryTransactions(prev => [newTxn, ...prev]);
    setInventoryItems(prev => prev.map(i => {
      if (i.id === txn.itemId) {
        const newQuantity = txn.type === "receive" ? i.quantity + txn.quantity : i.quantity - txn.quantity;
        const newStatus = newQuantity === 0 ? "out_of_stock" : newQuantity <= 10 ? "low_stock" : "available";
        return { ...i, quantity: newQuantity, status: newStatus };
      }
      return i;
    }));
  };

  const addStaff = (staffData: Omit<Staff, "id">) => {
    setStaff(prev => [{ ...staffData, id: `EMP-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  };

  const upsertStaffAttendance = (record: StaffAttendanceRecord) => {
    setStaffAttendance(prev => {
      const existing = prev.findIndex(r => r.staffId === record.staffId && r.date === record.date);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = record;
        return next;
      }
      return [...prev, record];
    });
  };

  const addStaffAdvance = (advanceData: Omit<StaffAdvance, "id">) => {
    setStaffAdvances(prev => [{ ...advanceData, id: `ADV-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const softDeleteStaff = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, isDeleted: true, deletedAt: new Date().toISOString() } : s));
  };

  const restoreStaff = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, isDeleted: false, deletedAt: undefined } : s));
  };

  const hardDeleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const restoreItem = (type: 'student' | 'guardian' | 'staff', id: string) => {
    if (type === 'student') restoreStudent(id);
    else if (type === 'staff') restoreStaff(id);
    else restoreGuardian(id);
  };

  const hardDeleteItem = (type: 'student' | 'guardian' | 'staff', id: string) => {
    if (type === 'student') hardDeleteStudent(id);
    else if (type === 'staff') hardDeleteStaff(id);
    else hardDeleteGuardian(id);
  };

  const addClinicVisit = (visitData: Omit<ClinicVisit, "id" | "studentName" | "stage">) => {
    const student = students.find(s => s.id === visitData.studentId);
    if (!student) return;

    const newVisit: ClinicVisit = {
      ...visitData,
      id: `CV-${Math.floor(1000 + Math.random() * 9000)}`,
      studentName: student.name,
      stage: student.stage,
    };
    setClinicVisits(prev => [newVisit, ...prev]);
  };

  const addDisciplineIncident = (incidentData: Omit<DisciplineIncident, "id" | "studentName" | "stage">) => {
    const student = students.find(s => s.id === incidentData.studentId);
    if (!student) return;

    const newIncident: DisciplineIncident = {
      ...incidentData,
      id: `DI-${Math.floor(1000 + Math.random() * 9000)}`,
      studentName: student.name,
      stage: student.stage,
    };
    setDisciplineIncidents(prev => [newIncident, ...prev]);
  };

  const addSection = (sectionData: Omit<Section, "id">) => {
    setSections(prev => [{ ...sectionData, id: `SEC-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const addExamType = (typeData: Omit<ExamType, "id">) => {
    setExamTypes(prev => [{ ...typeData, id: `EXT-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  };

  const updateExamType = (id: string, updates: Partial<ExamType>) => {
    setExamTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteExamType = (id: string) => {
    setExamTypes(prev => prev.filter(t => t.id !== id));
  };

  const addExam = (examData: Omit<Exam, "id">) => {
    setExams(prev => [{ ...examData, id: `EX-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  };

  const deleteExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
  };

  const saveExamMarks = (newMarks: Omit<ExamMark, "id">[]) => {
    setExamMarks(prev => {
      let updated = [...prev];
      for (const m of newMarks) {
        const existingIdx = updated.findIndex(exm => exm.examId === m.examId && exm.studentId === m.studentId);
        if (existingIdx >= 0) {
          updated[existingIdx] = { ...updated[existingIdx], mark: m.mark, notes: m.notes };
        } else {
          updated.push({ ...m, id: `EM-${Math.floor(1000 + Math.random() * 9000)}` });
        }
      }
      return updated;
    });
  };

  const saveExamGrades = (newGrades: Omit<ExamGrade, "id">[]) => {
    setExamGrades(prev => {
      let updated = [...prev];
      for (const g of newGrades) {
        const existingIdx = updated.findIndex(exg => exg.examId === g.examId && exg.studentId === g.studentId);
        if (existingIdx >= 0) {
          updated[existingIdx] = { ...updated[existingIdx], mark: g.mark, descriptiveGrade: g.descriptiveGrade, notes: g.notes };
        } else {
          updated.push({ ...g, id: `EG-${Math.floor(1000 + Math.random() * 9000)}` });
        }
      }
      return updated;
    });
  };

  const addScheduledExam = (examData: Omit<ScheduledExam, "id" | "createdAt">) => setScheduledExams(p => [{ ...examData as any, id: `SE-${Math.floor(1000 + Math.random() * 9000)}` }, ...p]);
  const updateScheduledExam = (id: string, updates: Partial<ScheduledExam>) => setScheduledExams(p => p.map(e => e.id === id ? { ...e, ...updates } : e));
  const deleteScheduledExam = (id: string) => setScheduledExams(p => p.filter(e => e.id !== id));

  const addExamCategory = (cat: Omit<ExamCategory, "id">) => setExamCategories(p => [{ ...cat, id: `EC-${Math.floor(1000 + Math.random() * 9000)}` }, ...p]);
  const deleteExamCategory = (id: string) => setExamCategories(p => p.filter(c => c.id !== id));

  const addSubject = (subjectData: Omit<Subject, "id">) => {
    setSubjects(prev => [{ ...subjectData, id: `SUB-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const updateScheduleSlot = (slotData: Omit<ScheduleSlot, "id">) => {
    setScheduleSlots(prev => {
      const existingIdx = prev.findIndex(s => s.sectionId === slotData.sectionId && s.day === slotData.day && s.period === slotData.period);
      if (existingIdx >= 0) {
        let updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...slotData };
        return updated;
      } else {
        return [...prev, { ...slotData, id: `SCH-${Math.floor(1000 + Math.random() * 9000)}` }];
      }
    });
  };

  const clearScheduleSlot = (sectionId: string, day: string, period: number) => {
    setScheduleSlots(prev => prev.filter(s => !(s.sectionId === sectionId && s.day === day && s.period === period)));
  };

  const addAcademicYear = (yearData: Omit<AcademicYear, "id">) => {
    setAcademicYears(prev => {
      let newState = [...prev];
      if (yearData.isCurrent) {
        newState = newState.map(y => ({ ...y, isCurrent: false }));
      }
      newState.push({ ...yearData, id: `Y-${Math.floor(1000 + Math.random() * 9000)}` });
      return newState;
    });
  };

  const updateAcademicYear = (id: string, updates: Partial<AcademicYear>) => {
    setAcademicYears(prev => {
      let newState = [...prev];
      if (updates.isCurrent) {
        newState = newState.map(y => ({ ...y, isCurrent: false }));
      }
      newState.map(y => y.id === id ? { ...y, ...updates } : y);
      return newState;
    });
  };

  const addTeachingAssignment = (assignmentData: Omit<TeachingAssignment, "id">) => {
    setTeachingAssignments(prev => [{ ...assignmentData, id: `TA-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  };

  const deleteTeachingAssignment = (id: string) => {
    setTeachingAssignments(prev => prev.filter(a => a.id !== id));
  };

  const addMaintenanceRequest = (req: Omit<MaintenanceRequest, "id">) => {
    setMaintenanceRequests(prev => [{ ...req, id: `MR-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  };
  const updateMaintenanceRequest = (id: string, updates: Partial<MaintenanceRequest>) => {
    setMaintenanceRequests(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, ...updates };
        if (updates.status === "completed" && r.status !== "completed" && updated.costEstimate) {
          // create expense when maintenance completed
          addExpense({
            title: `صيانة: ${updated.title}`,
            amount: updated.costEstimate,
            date: new Date().toISOString().split("T")[0],
            categoryId: "EXPCAT-4", // Maintenance category
            beneficiary: "مقاول صيانة",
            method: "bank_transfer"
          });
        }
        return updated;
      }
      return r;
    }));
  };
  const undoMaintenanceRequest = (id: string) => setMaintenanceRequests(prev => prev.map(r => r.id === id ? { ...r, status: "new" } : r));
  const deleteMaintenanceRequest = (id: string) => {
    setMaintenanceRequests(prev => prev.filter(r => r.id !== id));
  };

  const addRoom = (room: Omit<Room, "id">) => setRooms(prev => [{ ...room, id: `RM-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  const updateRoom = (id: string, updates: Partial<Room>) => setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  const deleteRoom = (id: string) => setRooms(prev => prev.filter(r => r.id !== id));

  const addStaffEvaluation = (evalData: Omit<StaffEvaluation, "id">) => setStaffEvaluations(prev => [{ ...evalData, id: `SE-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  const addStaffContract = (contractData: Omit<StaffContract, "id">) => setStaffContracts(prev => [{ ...contractData, id: `SC-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  
  const addStaffLeave = (leaveData: Omit<StaffLeave, "id">) => setStaffLeaves(prev => [{ ...leaveData, id: `SL-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  const updateStaffLeave = (id: string, updates: Partial<StaffLeave>) => setStaffLeaves(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));

  const addActivityLog = (logData: Omit<ActivityLog, "id" | "date">) => {
    setActivityLogs(prev => [{ ...logData, id: `AL-${Math.floor(1000 + Math.random() * 9000)}`, date: new Date().toISOString() }, ...prev]);
  };

  const addUser = (userData: Omit<UserAccount, "id">) => {
    const newUser: UserAccount = { ...userData, id: `U-${Math.floor(1000 + Math.random() * 9000)}` };
    setUsers(prev => [newUser, ...prev]);
    addActivityLog({ user: "مدير النظام", action: "إضافة مستخدم", entity: "المستخدمون", details: `تم إنشاء حساب: ${userData.fullName} (${userData.username})` });
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    const user = users.find(u => u.id === id);
    addActivityLog({ user: "مدير النظام", action: "تعديل مستخدم", entity: "المستخدمون", details: `تم تعديل حساب: ${user?.fullName || id}` });
  };

  const deleteUser = (id: string) => {
    const user = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    addActivityLog({ user: "مدير النظام", action: "حذف مستخدم", entity: "المستخدمون", details: `تم حذف حساب: ${user?.fullName || id}` });
  };

  const generateBulkData = (count: number) => {
    const stages: EducationalStage[] = ["kindergarten", "primary", "middle", "high"];
    const names = ["أحمد", "محمد", "علي", "سارة", "فاطمة", "خالد", "عبدالله", "عمر", "نورة", "مريم", "سعد", "فيصل", "نوف", "هند", "عبير"];
    const family = ["العتيبي", "القحطاني", "الشمري", "الدوسري", "الزهراني", "المطيري", "الغامدي", "العنزي", "الشهري", "السبيعي"];
    const grades = ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع", "الصف الخامس", "الصف السادس", "مستوى أول", "مستوى ثاني"];

    const newStudents: Student[] = [];
    const newInvoices: Invoice[] = [];
    const newClinicVisits: ClinicVisit[] = [];
    const newDisciplineIncidents: DisciplineIncident[] = [];
    const newLibraryIssues: LibraryIssue[] = [];

    // Optimize DOM freeze by using Date.now once
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const name = `${names[Math.floor(Math.random() * names.length)]} ${names[Math.floor(Math.random() * names.length)]} ${family[Math.floor(Math.random() * family.length)]}`;
      const id = `STU-BLK-${i}-${now}`;
      
      newStudents.push({
        id,
        name,
        dob: "2010-01-01",
        nationalId: `1${Math.floor(Math.random() * 900000000)}`,
        guardianName: `والد ${name}`,
        stage,
        grade: grades[Math.floor(Math.random() * grades.length)],
        status: "نشط",
        gender: Math.random() > 0.5 ? "ذكر" : "أنثى"
      });

      const isPaid = Math.random() > 0.5;
      newInvoices.push({
        id: `INV-BLK-${i}-${now}`,
        studentId: id,
        studentName: name,
        amount: 5000,
        paid: isPaid ? 5000 : 0,
        dueDate: "2024-01-01",
        status: isPaid ? "paid" : "unpaid",
        stage
      });

      if (Math.random() > 0.95) {
        newClinicVisits.push({
           id: `CV-BLK-${i}-${now}`,
           studentId: id,
           studentName: name,
           date: new Date().toISOString().split("T")[0],
           symptoms: "صداع",
           diagnosis: "إرهاق",
           actionTaken: "إعطاء مسكن",
           stage
        });
      }

      if (Math.random() > 0.95) {
        newDisciplineIncidents.push({
          id: `DI-BLK-${i}-${now}`,
          studentId: id,
          studentName: name,
          date: new Date().toISOString().split("T")[0],
          type: Math.random() > 0.5 ? "positive" : "negative",
          category: "سلوك عام",
          points: 10,
          description: "ملاحظة سلوكية مسجلة آلياً",
          stage
        });
      }

      if (Math.random() > 0.98) {
        newLibraryIssues.push({
          id: `IS-BLK-${i}-${now}`,
          bookId: "B-1001",
          bookTitle: "كتاب الإعارة التلقائي",
          studentId: id,
          studentName: name,
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date().toISOString().split("T")[0],
          status: "active",
          stage
        });
      }
    }

    setStudents(prev => [...newStudents, ...prev]);
    setInvoices(prev => [...newInvoices, ...prev]);
    setClinicVisits(prev => [...newClinicVisits, ...prev]);
    setDisciplineIncidents(prev => [...newDisciplineIncidents, ...prev]);
    setLibraryIssues(prev => [...newLibraryIssues, ...prev]);
  };

  const addTextbook = (tb: Omit<Textbook, "id">) => setTextbooks(prev => [{ ...tb, id: `TB-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  const updateTextbook = (id: string, updates: Partial<Textbook>) => setTextbooks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const deleteTextbook = (id: string) => setTextbooks(prev => prev.filter(t => t.id !== id));
  const distributeTextbook = (distribution: Omit<TextbookDistribution, "id" | "date" | "status">) => {
    setTextbookDistributions(prev => [{
      id: `TBD-${Math.floor(1000 + Math.random() * 9000)}`,
      ...distribution,
      date: new Date().toISOString().split('T')[0],
      status: "distributed",
    }, ...prev]);
  };
  const removeDistribution = (id: string) => setTextbookDistributions(prev => prev.filter(d => d.id !== id));

  const addTransportRoute = (r: Omit<TransportRoute, "id">) => setTransportRoutes(prev => [{ ...r, id: `RT-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  const updateTransportRoute = (id: string, updates: Partial<TransportRoute>) => setTransportRoutes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  const deleteTransportRoute = (id: string) => setTransportRoutes(prev => prev.filter(r => r.id !== id));

  const addTransportSubscription = (s: Omit<TransportSubscription, "id">) => setTransportSubscriptions(prev => [{ ...s, id: `SUB-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  const updateTransportSubscription = (id: string, updates: Partial<TransportSubscription>) => setTransportSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  const deleteTransportSubscription = (id: string) => setTransportSubscriptions(prev => prev.filter(s => s.id !== id));

  const updateTimetableSettings = (updates: Partial<TimetableSettings>) => setTimetableSettings(prev => ({ ...prev, ...updates }));

  return (
    <GlobalStoreContext.Provider value={{
      allStudents: students,
      allDeletedStudents,
      allInvoices: invoices, allFeeStructures: feeStructures, allDiscounts: discounts, allPayments: payments, allExpenses: expenses, allExpenseCategories: expenseCategories, allBooks: books, allLibraryIssues: libraryIssues,
      allInventoryItems: inventoryItems, allInventoryTransactions: inventoryTransactions,
      allStaff: staff, allClinicVisits: clinicVisits, allDisciplineIncidents: disciplineIncidents,
      allSections: sections, allExams: exams, allExamMarks: examMarks, allExamTypes: examTypes, allSubjects: subjects,
      allScheduleSlots: scheduleSlots, allAcademicYears: academicYears, allTeachingAssignments: teachingAssignments,
      allScheduledExams: scheduledExams, allExamCategories: examCategories, allExamGrades: examGrades,
      
      allMaintenanceRequests: maintenanceRequests, allRooms: rooms,
      allStaffEvaluations: staffEvaluations, allStaffContracts: staffContracts, allStaffLeaves: staffLeaves,
      allStaffAttendance: staffAttendance, allStaffAdvances: staffAdvances,
      allActivityLogs: activityLogs,
      allUsers: users,

      activeStageStudents, activeStageInvoices, activeStageFeeStructures, activeStageBooks, activeStageLibraryIssues,
      activeStageStaff, activeStageStaffAttendance, activeStageClinicVisits, activeStageDisciplineIncidents, activeStageSections,
      activeStageExams, activeStageExamMarks, activeStageExamTypes, activeStageSubjects,
      activeStageScheduleSlots, activeStageTeachingAssignments,
      activeStageScheduledExams, activeStageExamCategories, activeStageExamGrades,
      allGuardians: guardians,
      
      allTextbooks: textbooks,
      allTextbookDistributions: textbookDistributions,
      activeStageTextbooks,
      activeStageDistributions,
      addTextbook,
      updateTextbook,
      deleteTextbook,
      distributeTextbook,
      removeDistribution,
      transportRoutes,
      transportSubscriptions,
      addTransportRoute,
      updateTransportRoute,
      deleteTransportRoute,
      addTransportSubscription,
      updateTransportSubscription,
      deleteTransportSubscription,
      activeStageTimetableSettings,
      updateTimetableSettings,
      systemSettings,
      updateSettings,
      
      addStudent,
      updateStudent,
      softDeleteStudent,
      restoreStudent,
      hardDeleteStudent,
      addGuardian, updateGuardian, softDeleteGuardian, restoreGuardian, hardDeleteGuardian,
      restoreItem, hardDeleteItem,
      addPayment, addInvoice, updateInvoice, deleteInvoice, addFeeStructure, updateFeeStructure, deleteFeeStructure, addDiscount, updateDiscount, deleteDiscount, addExpense, updateExpense, deleteExpense,
      addBook, issueBook, returnBook, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      processInventoryTransaction, addStaff, updateStaff, deleteStaff: hardDeleteStaff, upsertStaffAttendance, addStaffAdvance, addClinicVisit, addDisciplineIncident,
      addSection, updateSection, deleteSection, 
      examGradingMode,
      setExamGradingMode,
      currency,
      setCurrency,
      addExamType, updateExamType, deleteExamType,
      addExam, deleteExam, saveExamMarks, saveExamGrades, addSubject, deleteSubject,
      addScheduledExam, updateScheduledExam, deleteScheduledExam, addExamCategory, deleteExamCategory,
      updateScheduleSlot, clearScheduleSlot, addAcademicYear, updateAcademicYear, addTeachingAssignment, deleteTeachingAssignment,
      assignStudentToSection,
      promoteStudents,
      
      addMaintenanceRequest, updateMaintenanceRequest, undoMaintenanceRequest, deleteMaintenanceRequest,
      addRoom, updateRoom, deleteRoom,
      addStaffEvaluation, addStaffContract, addStaffLeave, updateStaffLeave,
      addActivityLog,
      addUser, updateUser, deleteUser,

      generateBulkData,

      notifications,
      unreadNotificationsCount,
      markAllNotificationsAsRead,
      deleteNotification,
      addNotification
    }}>
      {children}
    </GlobalStoreContext.Provider>
  );
}

export function useGlobalStore() {
  const context = useContext(GlobalStoreContext);
  if (context === undefined) throw new Error("useGlobalStore must be used within a GlobalStoreProvider");
  return context;
}
