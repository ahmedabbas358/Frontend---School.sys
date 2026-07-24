import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { EducationalStage, useStage, GRADE_OPTIONS } from "./StageContext";

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  relation: string;
  address?: string;
  gender?: "ذكر" | "أنثى";
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
  status?: "نشط" | "موقوف" | "منقول" | "خريج" | "راسب" | "ناجح";
  enrollmentHistory?: EnrollmentRecord[];
  major?: "science" | "literature";
  pickupPersons?: string;
  specialCare?: boolean;
  elective?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  academicYearId: string;
  stage: EducationalStage;
  grade: string;
  sectionId?: string;
  major?: "science" | "literature";
  elective?: string;
  status: "نشط" | "موقوف" | "منقول" | "خريج" | "راسب" | "ناجح";
  enrollmentDate: string;
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

export type EntityType = 'student' | 'staff' | 'guardian' | 'enrollment' | 'invoice' | 'payment' | 'expense' | 'payroll' | 'none';

export interface Invoice {
  id: string;
  studentId: string; // Kept for backward compatibility
  enrollmentId?: string; // New ERP requirement
  academicYearId?: string;
  studentName: string; 
  title?: string;
  amount: number;
  discountId?: string;
  discountAmount?: number;
  netAmount?: number;
  paid: number;
  dueDate: string;
  issueDate?: string;
  status: "draft" | "approved" | "issued" | "partial" | "paid" | "cancelled" | "written_off";
  stage: EducationalStage;
  category?: string; // e.g. "tuition", "transport", "books"
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
  installments?: { name: string, percentage: number, dueDate: string }[];
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
  invoiceId?: string;
  studentId?: string;
  amount: number;
  date: string;
  method: "cash" | "bank_transfer" | "card" | "cheque";
  referenceNo?: string;
  notes?: string;
  treasuryId?: string;
  sessionId?: string;
}

export interface Treasury {
  status?: string;
  accountId?: string;
  id: string;
  name: string;
  balance: number;
  code?: string;
  custodianName?: string;
  type?: string;
}

export interface CashSession {
  openedBy?: string;
  id: string;
  treasuryId: string;
  userId: string;
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
  openingBalance: number;
  closingBalance?: number;
  difference?: number;
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
  academicYearId?: string;
  costCenterId?: string;
  status?: "draft" | "submitted" | "reviewed" | "approved" | "paid" | "posted";
  sessionId?: string;
}

export interface Vendor {
  id: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  category: string;
  balance: number;
  status: "active" | "inactive";
  taxId?: string;
  taxNumber?: string;
  address?: string;
  notes?: string;
}

export interface Account {
  id: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  code: string;
  description?: string;
  isSystemAccount?: boolean;
  parentId?: string;
  isActive?: boolean;
  isFavorite?: boolean;
  lastUsedDate?: string;
  requiredEntityType?: EntityType;
  costCenterId?: string;
  isGroupAccount?: boolean;
  normalBalance?: "debit" | "credit";
}

export interface JournalEntry {
  id: string;
  academicYearId: string;
  date: string;
  referenceId?: string;
  referenceType?: "invoice" | "payment" | "expense" | "manual" | "payroll";
  description: string;
  status: "posted" | "draft" | "voided";
  isAutoGenerated?: boolean;
  sourceDocumentType?: EntityType;
  sourceDocumentId?: string;
  lines?: JournalLine[];
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  debit: number;
  credit: number;
  studentId?: string;
  referenceId?: string;
  referenceType?: EntityType | "invoice" | "payment" | "expense" | "manual" | "payroll" | string;
  description?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: "create" | "update" | "delete";
  entityType: EntityType | string;
  entityId: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
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
  nationalId?: string;
  subjects?: string[];
  sections?: string[];
  isDeleted?: boolean;
  deletedAt?: string;
  basicSalary?: number;
  allowance?: number;
  deduction?: number;
  // New Payroll Fields
  paymentType?: "Monthly" | "Weekly" | "PerLesson" | "Daily";
  rate?: number;
  hireDate?: string;
}

export interface EmployeeAssignment {
  id: string;
  employeeId: string;
  academicYearId: string;
  stage: EducationalStage | "all";
  role: string;
  department: string;
  status: "active" | "on_leave" | "terminated";
  basicSalary?: number;
  allowance?: number;
  deduction?: number;
  paymentType?: "Monthly" | "Weekly" | "PerLesson" | "Daily";
  rate?: number;
  subjects?: string[];
  sections?: string[];
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

export interface AttendanceSession {
  id: string;
  academicYearId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  periodNumber: number;
  date: string;
  status: "open" | "closed";
  createdBy: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentEnrollmentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "LEFT_EARLY" | "SICK" | "SUSPENDED" | "REMOTE";
  reason?: string;
  note?: string;
  markedBy: string;
  markedAt: string;
}

export interface AttendanceExcuse {
  id: string;
  studentEnrollmentId: string;
  attendanceRecordId: string;
  reason: string;
  attachment?: string;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy?: string;
  approvedAt?: string;
}

export interface BehaviorTransaction {
  id: string;
  studentEnrollmentId: string;
  type: "positive" | "negative";
  points: number;
  categoryId?: string;
  reason: string;
  createdBy: string;
  date: string;
}

export interface DisciplineCategory {
  id: string;
  name: string;
  type: "academic" | "behavioral" | "appearance";
  severity: "low" | "medium" | "high";
  defaultPoints: number;
  recommendedAction: string;
}

export interface DisciplineIncident {
  id: string;
  studentEnrollmentId: string;
  date: string;
  location?: string;
  description: string;
  witnesses?: string;
  responsiblePerson: string;
  attachments?: string;
  actionTaken?: string;
}

export interface DisciplineAction {
  id: string;
  incidentId: string;
  type: string;
  date: string;
  responsiblePerson: string;
  notes?: string;
}

export interface Section {
  id: string;
  name: string;
  grade: string;
  capacity: number;
  stage: EducationalStage;
  homeroomTeacher?: string;
  roomId?: string;
  roomName?: string;
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

export interface Exam {
  id: string;
  academicYearId: string;
  name: string; // e.g., "اختبار منتصف الفصل الدراسي الأول"
  term: string; // "الفصل الأول"
  type: "midterm" | "final" | "quiz" | "monthly";
  startDate: string;
  endDate: string;
  status: "draft" | "upcoming" | "ongoing" | "grading" | "completed";
}

export interface ExamSubject {
  id: string;
  examId: string;
  subjectId: string;
  date: string; // specific date for this subject's exam
  maxScore: number;
  passScore: number;
  weight: number; // e.g., 20% of the term
  stage: EducationalStage | "all";
  grade: string; // e.g. "الصف الأول"
}

export interface ExamResult {
  id: string;
  examSubjectId: string;
  studentEnrollmentId: string;
  mark: number;
  notes?: string;
  status: "draft" | "submitted" | "approved" | "published";
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
  assignedSectionId?: string;
  assignedSectionName?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  balance: number;
  currency: string;
  status: "active" | "inactive";
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
  type?: "full_time" | "part_time" | "contractor";
  contractType?: "full_time" | "part_time" | "contractor";
  startDate: string;
  endDate: string;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  status: "active" | "expired" | "renewing";
}

export interface StaffLeave {
  id: string;
  staffId: string;
  staffName: string;
  type: "annual" | "sick" | "issued" | "emergency";
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
// --- Full Enterprise Benchmark Generator (15,000 Students + All Modules) ---
function generateFullEnterpriseSchoolData() {
  const stages: EducationalStage[] = ["kindergarten", "primary", "middle", "high"];
  const firstNames = ["أحمد", "محمد", "علي", "سارة", "فاطمة", "خالد", "عبدالله", "عمر", "نورة", "مريم", "سعد", "فيصل", "نوف", "هند", "عبير", "زياد", "طلال", "ياسر", "ريم", "لمى", "طارق", "بدر", "أمل", "منى", "حسام", "باسم", "أسماء", "خديجة", "إبراهيم", "وليد"];
  const fatherNames = ["سليمان", "عبد العزيز", "إبراهيم", "صالح", "فهد", "منصور", "وليد", "ماجد", "تركي", "سعود", "حسين", "عادل", "مازن", "سعيد", "حمد", "أشرف", "سامي", "رائد", "هشام", "عصام"];
  const familyNames = ["العتيبي", "القحطاني", "الشمري", "الدوسري", "الزهراني", "المطيري", "الغامدي", "العنزي", "الشهري", "السبيعي", "الحربي", "البقمي", "المالكي", "التميمي", "السعيد", "الأحمدي", "العوفي", "السلمي", "الرويلي", "الزيعي"];
  
  const gradesMap: Record<EducationalStage, string[]> = {
    kindergarten: ["روضة 1", "روضة 2", "تمهيدي"],
    primary: ["الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي", "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"],
    middle: ["الصف الأول المتوسط", "الصف الثاني المتوسط", "الصف الثالث المتوسط"],
    high: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"],
  };

  // --- 1. Transport Routes ---
  const generatedTransportRoutes: TransportRoute[] = [
    { id: "RT-101", name: "خط حي النهضة والأندلس", destination: "المجمع المدرسي الرئيسي (جميع المراحل)", driverName: "محمد عبدالله السعيد", driverPhone: "0501234567", supervisorName: "أحمد الفاضل", vehiclePlate: "أ ب ج 1234", capacity: 45, stops: 6, feeAmount: 350, feeMode: "monthly" },
    { id: "RT-102", name: "خط حي الروضة والزهراء", destination: "المجمع المدرسي الرئيسي (جميع المراحل)", driverName: "خالد بن علي الحربي", driverPhone: "0559876543", supervisorName: "محمود الشريف", vehiclePlate: "س ص ع 5678", capacity: 45, stops: 5, feeAmount: 300, feeMode: "monthly" },
    { id: "RT-103", name: "خط حي الشاطئ والمرجان", destination: "المجمع المدرسي الرئيسي (جميع المراحل)", driverName: "عمر فاروق حسن", driverPhone: "0561122334", supervisorName: "ياسر العتيبي", vehiclePlate: "د هـ و 9012", capacity: 40, stops: 7, feeAmount: 400, feeMode: "monthly" },
    { id: "RT-104", name: "خط حي الخزامى والصحافة", destination: "المجمع المدرسي الرئيسي (جميع المراحل)", driverName: "سعد ابراهيم القحطاني", driverPhone: "0504455667", supervisorName: "عصام الدوسري", vehiclePlate: "ر ز س 4321", capacity: 45, stops: 6, feeAmount: 350, feeMode: "monthly" },
    { id: "RT-105", name: "خط حي السلام والنسيم", destination: "المجمع المدرسي الرئيسي (جميع المراحل)", driverName: "فهد ماجد الشمري", driverPhone: "0543322110", supervisorName: "سليمان الغامدي", vehiclePlate: "ش ص ض 8765", capacity: 50, stops: 8, feeAmount: 320, feeMode: "monthly" },
    { id: "RT-106", name: "خط حي الملك فهد والعقيق", destination: "المجمع المدرسي الرئيسي (جميع المراحل)", driverName: "وليد تركي المطيري", driverPhone: "0598877665", supervisorName: "بدر الشهري", vehiclePlate: "ط ظ ع 2468", capacity: 45, stops: 5, feeAmount: 380, feeMode: "monthly" }
  ];

  // --- 2. Sections & Rooms ---
  const generatedSections: Section[] = [];
  const generatedRooms: Room[] = [
    { id: "RM-LAB1", name: "معمل العلوم المركزية", building: "المبنى ب", floor: "الأول", type: "lab", capacity: 35, status: "available" },
    { id: "RM-LAB2", name: "معمل الحاسب والبرمجة", building: "المبنى ج", floor: "الثاني", type: "lab", capacity: 35, status: "available" },
    { id: "RM-LIB1", name: "المكتبة المركزية العامة", building: "المبنى أ", floor: "الأرضي", type: "hall", capacity: 100, status: "available" },
    { id: "RM-HALL1", name: "المسرح المدرسي والاحتفالات", building: "المبنى الرئيسي", floor: "الأرضي", type: "hall", capacity: 350, status: "available" },
    { id: "RM-CLN1", name: "العيادة الصحية والتمريض", building: "المبنى أ", floor: "الأرضي", type: "office", capacity: 10, status: "available" }
  ];

  let secCounter = 101;
  stages.forEach(s => {
    const grades = gradesMap[s];
    grades.forEach(g => {
      ["أ", "ب", "ج"].forEach(secName => {
        const secId = `SEC-${secCounter}`;
        const roomId = `RM-${secCounter}`;
        const roomName = `قاعة ${secCounter}`;

        generatedSections.push({
          id: secId,
          name: secName,
          grade: g,
          capacity: 30,
          stage: s,
          roomId,
          roomName
        });

        generatedRooms.push({
          id: roomId,
          name: roomName,
          building: s === "high" ? "المبنى ج" : s === "middle" ? "المبنى ب" : "المبنى أ",
          floor: "الأرضي",
          type: "classroom",
          capacity: 30,
          status: "occupied",
          assignedSectionId: secId,
          assignedSectionName: `${g} - شعبة ${secName}`
        });

        secCounter++;
      });
    });
  });

  // --- 3. 500 Staff, Workers & Teachers (الموارد البشرية والكادر الإداري والتعليمي والخدماتي) ---
  const generatedStaff: Staff[] = [
    { id: "EMP-1001", employeeNo: "EMP-001", name: "د. خالد عبدالرحمن القحطاني", role: "مدير المدرسة العام", department: "الإدارة العامة", status: "active", stage: "all", basicSalary: 18000, allowance: 3000, deduction: 0, paymentType: "Monthly", phone: "0501112233", hireDate: "2020-01-15" },
    { id: "EMP-1002", employeeNo: "EMP-002", name: "أستاذة منيرة الدوسري", role: "مديرة مرحلة رياض الأطفال", department: "رياض الأطفال", status: "active", stage: "kindergarten", basicSalary: 12000, allowance: 2000, deduction: 0, paymentType: "Monthly", phone: "0502223344", hireDate: "2021-08-01" },
    { id: "EMP-1003", employeeNo: "EMP-003", name: "أحمد المعلم السعيد", role: "معلم صف أول ابتدائي", department: "الشؤون الأكاديمية", status: "active", stage: "primary", basicSalary: 8500, allowance: 1200, deduction: 0, paymentType: "Monthly", phone: "0503334455", hireDate: "2022-09-01" },
    { id: "EMP-1004", employeeNo: "EMP-004", name: "فاطمة الزهراء الشمري", role: "معلمة علوم وفيزياء", department: "الشؤون الأكاديمية", status: "active", stage: "middle", basicSalary: 9000, allowance: 1500, deduction: 0, paymentType: "Monthly", phone: "0504445566", hireDate: "2022-09-01" },
    { id: "EMP-1005", employeeNo: "EMP-005", name: "م. ياسر العتيبي", role: "مسؤول تقنية المعلومات والنظام", department: "تقنية المعلومات", status: "active", stage: "all", basicSalary: 11000, allowance: 1800, deduction: 0, paymentType: "Monthly", phone: "0505556677", hireDate: "2021-03-10" },
    { id: "EMP-1006", employeeNo: "EMP-006", name: "د. أمل الغامدي", role: "طبيبة العيادة المدرسية", department: "الخدمات الطبية والعيادة", status: "active", stage: "all", basicSalary: 10000, allowance: 1500, deduction: 0, paymentType: "Monthly", phone: "0506667788", hireDate: "2023-01-10" },
    { id: "EMP-1007", employeeNo: "EMP-007", name: "محمد عبدالله السعيد", role: "سائق حافلة مدرسية", department: "النقل والتراحيل", status: "active", stage: "all", basicSalary: 4500, allowance: 800, deduction: 0, paymentType: "Monthly", phone: "0507778899", hireDate: "2022-08-15" },
    { id: "EMP-1008", employeeNo: "EMP-008", name: "خالد بن علي الحربي", role: "سائق حافلة مدرسية", department: "النقل والتراحيل", status: "active", stage: "all", basicSalary: 4500, allowance: 800, deduction: 0, paymentType: "Monthly", phone: "0508889900", hireDate: "2022-08-15" }
  ];

  // Comprehensive Catalog of Roles & Departments for 500 Staff & Workers
  const staffCatalog: { role: string; department: string; type: "Monthly" | "Weekly" | "PerLesson" | "Daily"; baseSal: number }[] = [
    // Teachers & Academic Staff (250)
    { role: "أستاذ رياضيات ثانوي", department: "الشؤون الأكاديمية", type: "Monthly", baseSal: 8500 },
    { role: "أستاذ فيزياء متمكن", department: "الشؤون الأكاديمية", type: "Monthly", baseSal: 9000 },
    { role: "أستاذ كيمياء وعقاقير", department: "الشؤون الأكاديمية", type: "Monthly", baseSal: 8800 },
    { role: "أستاذ أحياء وجيولوجيا", department: "الشؤون الأكاديمية", type: "Monthly", baseSal: 8600 },
    { role: "معلم لغة عربية ونحو", department: "الشؤون الأكاديمية", type: "Monthly", baseSal: 8200 },
    { role: "معلم دراسات إسلامية وثقافة", department: "الشؤون الأكاديمية", type: "Monthly", baseSal: 8000 },
    { role: "معلم لغة إنجليزية وتوفل", department: "الشؤون الأكاديمية", type: "Monthly", baseSal: 9200 },
    { role: "معلم حاسب وبرمجة", department: "الشؤون الأكاديمية", type: "Monthly", baseSal: 8900 },
    { role: "معلم صفوف أولية", department: "الصفوف الأولية", type: "Monthly", baseSal: 7800 },
    { role: "مربية أطفال ومهارات", department: "رياض الأطفال", type: "Monthly", baseSal: 6500 },
    { role: "معلم تربية بدنية ورياضة", department: "الأنشطة المدرسية", type: "Monthly", baseSal: 7500 },
    { role: "معلم تربية فنية ورسم", department: "الأنشطة المدرسية", type: "Monthly", baseSal: 7200 },
    { role: "معلم بالحصة (زائر)", department: "الشؤون الأكاديمية", type: "PerLesson", baseSal: 150 },

    // Administration & Counseling (50)
    { role: "وكيل الشؤون الأكاديمية", department: "الإدارة العامة", type: "Monthly", baseSal: 13000 },
    { role: "وكيل شؤون الطلاب", department: "الإدارة العامة", type: "Monthly", baseSal: 12500 },
    { role: "موجه طلابي وإرشاد", department: "الإرشاد والتوجيه", type: "Monthly", baseSal: 8500 },
    { role: "مرشد نفسي وسلوكي", department: "الإرشاد والتوجيه", type: "Monthly", baseSal: 8700 },
    { role: "مشرف دور ونظام", department: "الإشراف والإنضباط", type: "Monthly", baseSal: 6200 },

    // Finance & HR (40)
    { role: "مدير مالي رئيسي", department: "الشؤون المالية", type: "Monthly", baseSal: 14000 },
    { role: "محاسب أول حسابات", department: "الشؤون المالية", type: "Monthly", baseSal: 9500 },
    { role: "محاسب رواتب وتدقيق", department: "الشؤون المالية", type: "Monthly", baseSal: 8800 },
    { role: "أمين صندوق (كاشير)", department: "الشؤون المالية", type: "Monthly", baseSal: 7000 },
    { role: "أخصائي موارد بشرية", department: "الموارد البشرية", type: "Monthly", baseSal: 8500 },
    { role: "أمين قبول وتسجيل", department: "القبول والتسجيل", type: "Monthly", baseSal: 7500 },

    // Transport & Logistics (60)
    { role: "سائق حافلة مدرسية", department: "النقل والتراحيل", type: "Monthly", baseSal: 4800 },
    { role: "مشرف حافلة وتوصيل", department: "النقل والتراحيل", type: "Monthly", baseSal: 4200 },
    { role: "ميكانيكي وفني حركة", department: "النقل والتراحيل", type: "Monthly", baseSal: 5500 },

    // Services, Clinic & Labs (40)
    { role: "ممرض عيادة وتضميد", department: "الخدمات الطبية والعيادة", type: "Monthly", baseSal: 6800 },
    { role: "أمين مكتبة مركزية", department: "المكتبة العامة", type: "Monthly", baseSal: 7200 },
    { role: "فني معمل ومختبرات", department: "المختبرات والمعامل", type: "Monthly", baseSal: 6900 },
    { role: "أمين مستودع وأدوات", department: "المستودع والمشتريات", type: "Monthly", baseSal: 6600 },

    // Maintenance, Security & Workers (60)
    { role: "فني صيانة وتكييف", department: "الخدمات العامة والصيانة", type: "Daily", baseSal: 220 },
    { role: "حارس أمن مدرسي", department: "الأمن والسلامة", type: "Monthly", baseSal: 4500 },
    { role: "مشرف خدمات ونظافة", department: "الخدمات العامة والصيانة", type: "Monthly", baseSal: 5000 },
    { role: "عامل نظافة وتجهيز", department: "الخدمات العامة والصيانة", type: "Monthly", baseSal: 3200 },
    { role: "عامل ضيافة وسفرة", department: "الخدمات العامة والصيانة", type: "Weekly", baseSal: 800 }
  ];

  for (let sIdx = 9; sIdx <= 500; sIdx++) {
    const item = staffCatalog[sIdx % staffCatalog.length];
    const sStage = stages[sIdx % stages.length];
    const sName = `${firstNames[sIdx % firstNames.length]} ${fatherNames[(sIdx + 1) % fatherNames.length]} ${familyNames[(sIdx + 2) % familyNames.length]}`;
    const empNo = `EMP-${String(sIdx).padStart(3, '0')}`;
    const empId = `EMP-${1000 + sIdx}`;
    const phone = `05${String(30000000 + (sIdx * 19) % 89999999).padStart(8, '0')}`;
    const nationalId = `1${String(300000000 + (sIdx * 29) % 899999999)}`;
    const status: "active" | "on_leave" | "terminated" = (sIdx % 23 === 0) ? "on_leave" : (sIdx % 47 === 0) ? "terminated" : "active";
    const allowance = Math.round(item.baseSal * 0.15);
    const deduction = (sIdx % 11 === 0) ? 300 : 0;

    generatedStaff.push({
      id: empId,
      employeeNo: empNo,
      name: sName,
      role: item.role,
      department: item.department,
      status,
      stage: sStage,
      basicSalary: item.baseSal,
      allowance,
      deduction,
      paymentType: item.type,
      rate: item.type === "PerLesson" ? 150 : item.type === "Daily" ? 220 : item.baseSal,
      phone,
      nationalId,
      hireDate: "2023-08-15"
    });
  }

  const generatedEmployeeAssignments: EmployeeAssignment[] = generatedStaff.map(s => ({
    id: `EA-${s.id}`,
    employeeId: s.id,
    academicYearId: "Y-1002",
    stage: s.stage,
    role: s.role,
    department: s.department,
    status: s.status,
    basicSalary: s.basicSalary,
    allowance: s.allowance,
    deduction: s.deduction,
    paymentType: s.paymentType,
    rate: s.rate
  }));

  const generatedStaffContracts: StaffContract[] = generatedStaff.map(s => ({
    id: `SC-${s.id}`,
    staffId: s.id,
    staffName: s.name,
    type: s.paymentType === "PerLesson" ? "contractor" : "full_time",
    contractType: s.paymentType === "PerLesson" ? "contractor" : "full_time",
    startDate: "2024-08-01",
    endDate: "2025-08-01",
    basicSalary: s.basicSalary || 0,
    allowances: s.allowance || 0,
    deductions: s.deduction || 0,
    status: s.status === "terminated" ? "expired" : "active"
  }));

  // --- 4. 15,000 Students & Guardians ---
  const generatedStudents: Student[] = [];
  const generatedGuardians: Guardian[] = [];
  const generatedEnrollments: StudentEnrollment[] = [];
  const generatedInvoices: Invoice[] = [];
  const generatedTransportSubscriptions: TransportSubscription[] = [];

  const perStageCount = 3750; // 3750 per stage * 4 stages = 15,000 students
  let overallIndex = 1;

  stages.forEach(stage => {
    const grades = gradesMap[stage];
    const baseTuition = stage === "high" ? 8000 : stage === "middle" ? 6500 : stage === "primary" ? 5000 : 4500;
    const stageSections = generatedSections.filter(sec => sec.stage === stage);

    for (let i = 0; i < perStageCount; i++) {
      const fn = firstNames[i % firstNames.length];
      const mn = fatherNames[(i + 1) % fatherNames.length];
      const ln = familyNames[(i + 2) % familyNames.length];
      const fullName = `${fn} ${mn} ${ln}`;
      const guardianName = `${mn} ${ln}`;
      const guardianPhone = `05${String(10000000 + (overallIndex * 23) % 89999999).padStart(8, '0')}`;
      const studentId = `STU-15K-${String(overallIndex).padStart(5, '0')}`;
      const guardianId = `GRD-15K-${String(overallIndex).padStart(5, '0')}`;
      const grade = grades[i % grades.length];
      const isMale = (i % 2 === 0);
      const matchedSec = stageSections[i % stageSections.length];

      generatedStudents.push({
        id: studentId,
        name: fullName,
        dob: "2015-06-15",
        nationalId: `1${String(100000000 + (overallIndex * 17) % 899999999)}`,
        guardianName,
        guardianPhone,
        guardianRelation: "أب",
        stage,
        grade,
        sectionId: matchedSec?.id,
        gender: isMale ? "ذكر" : "أنثى",
        status: "نشط"
      });

      generatedGuardians.push({
        id: guardianId,
        name: guardianName,
        phone: guardianPhone,
        relation: "أب",
        gender: "ذكر",
        address: "المملكة العربية السعودية"
      });

      generatedEnrollments.push({
        id: `ENR-15K-${String(overallIndex).padStart(5, '0')}`,
        studentId,
        academicYearId: "Y-1002",
        stage,
        grade,
        sectionId: matchedSec?.id,
        status: "نشط",
        enrollmentDate: "2024-09-01"
      });

      const isPaid = (overallIndex % 3 === 0);
      const isPartial = !isPaid && (overallIndex % 2 === 0);
      const paid = isPaid ? baseTuition : isPartial ? baseTuition / 2 : 0;

      generatedInvoices.push({
        id: `INV-15K-${String(overallIndex).padStart(5, '0')}`,
        studentId,
        studentName: fullName,
        title: `الرسوم الدراسية - العام الدراسي الحالي`,
        amount: baseTuition,
        netAmount: baseTuition,
        discountAmount: 0,
        paid,
        dueDate: "2025-01-15",
        issueDate: "2024-09-01",
        status: isPaid ? "paid" : isPartial ? "partial" : "issued",
        stage,
        category: "tuition"
      });

      // Assign ~2,000 transport subscriptions
      if (overallIndex % 7 === 0) {
        const routeObj = generatedTransportRoutes[overallIndex % generatedTransportRoutes.length];
        const dir = (overallIndex % 5 === 0) ? "going" : (overallIndex % 4 === 0) ? "returning" : "round-trip";
        const fee = dir === "round-trip" ? routeObj.feeAmount : Math.round(routeObj.feeAmount * 0.6);

        generatedTransportSubscriptions.push({
          id: `SUB-15K-${overallIndex}`,
          studentId,
          routeId: routeObj.id,
          direction: dir,
          fee,
          status: "active"
        });

        // Add Transport Invoice
        generatedInvoices.push({
          id: `INV-TRP-${overallIndex}`,
          studentId,
          studentName: fullName,
          title: `رسوم التراحيل والنقل - ${routeObj.name}`,
          amount: fee,
          netAmount: fee,
          paid: isPaid ? fee : 0,
          dueDate: "2025-01-15",
          issueDate: "2024-09-01",
          status: isPaid ? "paid" : "issued",
          stage,
          category: "transport"
        });
      }

      overallIndex++;
    }
  });

  // --- 4b. Previous Students & Alumni (الطلاب السابقون والخريجون والمحولون والمحذوفون) ---
  const previousStatuses: ("خريج" | "منقول" | "موقوف" | "راسب")[] = ["خريج", "منقول", "موقوف", "راسب"];
  
  for (let prevIdx = 1; prevIdx <= 2500; prevIdx++) {
    const stage = stages[prevIdx % stages.length];
    const grades = gradesMap[stage];
    const grade = grades[prevIdx % grades.length];
    const fn = firstNames[prevIdx % firstNames.length];
    const mn = fatherNames[(prevIdx + 2) % fatherNames.length];
    const ln = familyNames[(prevIdx + 3) % familyNames.length];
    const fullName = `${fn} ${mn} ${ln}`;
    const guardianName = `${mn} ${ln}`;
    const guardianPhone = `05${String(20000000 + (prevIdx * 31) % 89999999).padStart(8, '0')}`;
    const studentId = `STU-PREV-${String(prevIdx).padStart(5, '0')}`;
    const guardianId = `GRD-PREV-${String(prevIdx).padStart(5, '0')}`;
    const isMale = (prevIdx % 2 === 0);
    const status = previousStatuses[prevIdx % previousStatuses.length];
    const isDeleted = (prevIdx % 5 === 0); // 500 soft deleted students in trash
    const academicYearId = (prevIdx % 2 === 0) ? "Y-1001" : "Y-1000"; // 1445 AH or 1444 AH

    const statusHist = (status === "موقوف" ? "منقول" : status) as "ناجح" | "راسب" | "منقول" | "خريج";

    generatedStudents.push({
      id: studentId,
      name: fullName,
      dob: "2013-04-10",
      nationalId: `1${String(200000000 + (prevIdx * 19) % 899999999)}`,
      guardianName,
      guardianPhone,
      guardianRelation: "أب",
      stage,
      grade,
      gender: isMale ? "ذكر" : "أنثى",
      status,
      academicYearId,
      enrollmentDate: (prevIdx % 2 === 0) ? "2023-09-01" : "2022-09-01",
      isDeleted,
      deletedAt: isDeleted ? "2024-06-15" : undefined,
      enrollmentHistory: [
        { id: `HIST-1-${prevIdx}`, academicYearId: "Y-1000", grade: "الصف الأول", status: "ناجح", date: "2023-06-10" },
        { id: `HIST-2-${prevIdx}`, academicYearId: "Y-1001", grade, status: statusHist, date: "2024-06-10" }
      ]
    });

    generatedGuardians.push({
      id: guardianId,
      name: guardianName,
      phone: guardianPhone,
      relation: "أب",
      gender: "ذكر",
      address: "المملكة العربية السعودية"
    });

    generatedEnrollments.push({
      id: `ENR-PREV-${String(prevIdx).padStart(5, '0')}`,
      studentId,
      academicYearId,
      stage,
      grade,
      status,
      enrollmentDate: (prevIdx % 2 === 0) ? "2023-09-01" : "2022-09-01"
    });
  }

  // --- 5. Subjects ---
  const generatedSubjects: Subject[] = [
    { id: "SUB-101", name: "الرياضيات العامة", code: "MATH101", creditHours: 5, stage: "primary", grades: ["الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي", "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"] },
    { id: "SUB-102", name: "العلوم والتكنولوجيا", code: "SCI101", creditHours: 4, stage: "primary", grades: ["الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"] },
    { id: "SUB-103", name: "اللغة العربية واللغويات", code: "ARAB101", creditHours: 6, stage: "all" },
    { id: "SUB-104", name: "القرآن الكريم والدراسات الإسلامية", code: "ISL101", creditHours: 4, stage: "all" },
    { id: "SUB-105", name: "الفيزياء التطبيقية", code: "PHYS201", creditHours: 4, stage: "high", grades: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"] },
    { id: "SUB-106", name: "الكيمياء العضوية", code: "CHEM201", creditHours: 4, stage: "high", grades: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"] },
    { id: "SUB-107", name: "الحاسب الآلي والذكاء الاصطناعي", code: "CS101", creditHours: 3, stage: "high", grades: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"] },
    { id: "SUB-108", name: "اللغة الإنجليزية المتقدمة", code: "ENG101", creditHours: 5, stage: "all" }
  ];

  // --- 6. Books & Library ---
  const generatedBooks: Book[] = [
    { id: "B-1001", title: "مناهج الرياضيات العامة - المجلد الأول", author: "وزارة التعليم", category: "رياضيات", copies: 500, available: 420, stage: "primary" },
    { id: "B-1002", title: "الفيزياء العامة والتجارب العملية", author: "د. أحمد زويل", category: "علوم", copies: 300, available: 210, stage: "high" },
    { id: "B-1003", title: "مقدمة في علوم الحاسب والبرمجة بلغة بايثون", author: "م. ياسر العتيبي", category: "حاسب", copies: 250, available: 180, stage: "high" },
    { id: "B-1004", title: "تاريخ الجزيرة العربية والحضارات", author: "د. حمد الجاسر", category: "تاريخ", copies: 200, available: 150, stage: "middle" }
  ];

  // --- 7. Inventory Items ---
  const generatedInventoryItems: InventoryItem[] = [
    { id: "ITM-001", name: "زي مدرسي بنين - مرحلة ابتدائية", category: "زي مدرسي", quantity: 1200, price: "120 ج.س", status: "available" },
    { id: "ITM-002", name: "زي مدرسي بنات - مرحلة متوسطة وثانوية", category: "زي مدرسي", quantity: 850, price: "140 ج.س", status: "available" },
    { id: "ITM-003", name: "أجهزة حاسب مكتبي i7 للمعامل", category: "أجهزة إلكترونية", quantity: 70, price: "3200 ج.س", status: "available" },
    { id: "ITM-004", name: "سبورات تفاعلية ذكية 85 بوصة", category: "تجهيزات فصول", quantity: 45, price: "6500 ج.س", status: "available" },
    { id: "ITM-005", name: "كرات قدم وركبي للأنشطة الرياضية", category: "معدات رياضية", quantity: 120, price: "45 ج.س", status: "available" }
  ];

  // --- 8. Expenses & Financial Transactions ---
  const generatedExpenses: Expense[] = [
    { id: "EXP-001", title: "صيانة وتحديث شبكات الفصول والـ Wi-Fi", amount: 14500, date: "2024-09-05", categoryId: "EXPCAT-4", beneficiary: "شركة شبكات الاتصالات", method: "bank_transfer" },
    { id: "EXP-002", title: "وقود وصيانة حافلات النقل المدرسي", amount: 18200, date: "2024-09-12", categoryId: "EXPCAT-4", beneficiary: "محطة الوقود المركزية", method: "bank_transfer" },
    { id: "EXP-003", title: "فاتورة الكهرباء والمياه للمجمع الرئيسي", amount: 24500, date: "2024-09-18", categoryId: "EXPCAT-3", beneficiary: "شركة الكهرباء والماء", method: "bank_transfer" },
    { id: "EXP-004", title: "مستلزمات ومطهرات العيادة والمرافق", amount: 6800, date: "2024-09-22", categoryId: "EXPCAT-5", beneficiary: "مؤسسة المستلزمات الطبية", method: "cash" }
  ];

  return {
    generatedStudents,
    generatedGuardians,
    generatedEnrollments,
    generatedInvoices,
    generatedTransportRoutes,
    generatedTransportSubscriptions,
    generatedStaff,
    generatedEmployeeAssignments,
    generatedStaffContracts,
    generatedSections,
    generatedRooms,
    generatedSubjects,
    generatedBooks,
    generatedInventoryItems,
    generatedExpenses
  };
}

const enterpriseData = generateFullEnterpriseSchoolData();
const initialStudents: Student[] = enterpriseData.generatedStudents;
const initialGuardians: Guardian[] = enterpriseData.generatedGuardians;
const initialStudentEnrollments: StudentEnrollment[] = enterpriseData.generatedEnrollments;
const initialInvoices: Invoice[] = enterpriseData.generatedInvoices;
const initialTransportRoutes: TransportRoute[] = enterpriseData.generatedTransportRoutes;
const initialTransportSubscriptions: TransportSubscription[] = enterpriseData.generatedTransportSubscriptions;
const initialStaff: Staff[] = enterpriseData.generatedStaff;
const initialEmployeeAssignments: EmployeeAssignment[] = enterpriseData.generatedEmployeeAssignments;
const initialStaffContracts: StaffContract[] = enterpriseData.generatedStaffContracts;
const initialSections: Section[] = enterpriseData.generatedSections;
const initialRooms: Room[] = enterpriseData.generatedRooms;
const initialSubjects: Subject[] = enterpriseData.generatedSubjects;
const initialBooks: Book[] = enterpriseData.generatedBooks;
const initialInventoryItems: InventoryItem[] = enterpriseData.generatedInventoryItems;
const initialExpenses: Expense[] = enterpriseData.generatedExpenses;

const initialExams: Exam[] = [];
const initialExamSubjects: ExamSubject[] = [];
const initialExamResults: ExamResult[] = [];

const initialFeeStructures: FeeStructure[] = [
  { id: "FEE-001", name: "الرسوم الدراسية - ابتدائي", amount: 15000, type: "tuition", stage: "primary", isMandatory: true, installments: [{ name: "القسط الأول", percentage: 50, dueDate: "2023-09-01" }, { name: "القسط الثاني", percentage: 50, dueDate: "2024-02-01" }] },
  { id: "FEE-002", name: "الرسوم الدراسية - متوسط", amount: 18000, type: "tuition", stage: "middle", isMandatory: true, installments: [{ name: "القسط الأول", percentage: 50, dueDate: "2023-09-01" }, { name: "القسط الثاني", percentage: 50, dueDate: "2024-02-01" }] },
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

const initialVendors: Vendor[] = [
  { id: "VND-001", name: "شركة الكهرباء والماء", category: "مرافق", phone: "011223344", balance: 0, status: "active" },
  { id: "VND-002", name: "مكتبة الشرق للطباعة", category: "مطبوعات وقرطاسية", phone: "011998877", balance: 1500, status: "active" }
];

const initialBankAccounts: BankAccount[] = [
  { id: "BNK-01", bankName: "بنك الخرطوم", accountName: "حساب المدرسة الرئيسي", accountNumber: "1234567890", iban: "SD98BOKH0001234567890", balance: 4500000, currency: "ج.س", status: "active" },
  { id: "BNK-02", bankName: "بنك أمدرمان الوطني", accountName: "حساب الرواتب والتشغيل", accountNumber: "0987654321", iban: "SD98ONBA0000987654321", balance: 1800000, currency: "ج.س", status: "active" }
];

const initialTreasuries: Treasury[] = [
  { id: "gl-treasury-main", name: "الخزينة الرئيسية (كاشير)", code: "TRS-01", custodianName: "أمين الصندوق الرئيسي", balance: 850000, status: "active", type: "cash" },
  { id: "gl-bank-main", name: "حساب بنك الخرطوم", code: "BNK-01", custodianName: "المحاسب المالي", balance: 4500000, status: "active", type: "bank" }
];

const initialCashSessions: CashSession[] = [];

const initialLibraryIssues: LibraryIssue[] = [
  { id: "IS-001", bookId: "B-1002", bookTitle: "مقدمة ابن خلدون", studentId: "STU-1003", studentName: "عمر فهد العتيبي", issueDate: "2023-10-01", dueDate: "2023-10-15", status: "active", stage: "high" },
];

const initialInventoryTransactions: InventoryTransaction[] = [
  { id: "TRX-001", type: "issue", itemId: "ITM-002", itemName: "حزمة كتب الصف الأول الثانوي", quantity: 1, to: "عمر فهد العتيبي", date: "2023-10-10", by: "أمين المستودع" },
];

const initialClinicVisits: ClinicVisit[] = [
  { id: "CV-001", studentId: "STU-1002", studentName: "سارة خالد السعيد", date: "2023-10-15", symptoms: "ارتفاع في درجة الحرارة", diagnosis: "حمى خفيفة", actionTaken: "إعطاء خافض حرارة والاتصال بولي الأمر", stage: "kindergarten" }
];
const initialAccounts: Account[] = [
  { id: "ACC-101", name: "الصندوق (Cash)", type: "asset", code: "101", isSystemAccount: true, description: "النقدية السائلة بالصندوق", isGroupAccount: false, normalBalance: "debit" },
  { id: "ACC-102", name: "الحساب البنكي (Bank)", type: "asset", code: "102", isSystemAccount: true, isGroupAccount: false, normalBalance: "debit" },
  { id: "ACC-103", name: "ذمم الطلاب", type: "asset", code: "103", isSystemAccount: true, description: "الرسوم المستحقة على الطلاب غير المسددة", isGroupAccount: false, normalBalance: "debit" },
  { id: "ACC-104", name: "سلف الموظفين", type: "asset", code: "104", isSystemAccount: true, isGroupAccount: false, normalBalance: "debit" },
  { id: "ACC-201", name: "مستحقات الموظفين", type: "liability", code: "201", isSystemAccount: true, description: "الرواتب المستحقة غير المدفوعة", isGroupAccount: false, normalBalance: "credit" },
  { id: "ACC-202", name: "الموردين والشركات", type: "liability", code: "202", isSystemAccount: true, description: "مستحقات لشركات خارجية", isGroupAccount: false, normalBalance: "credit" },
  { id: "ACC-401", name: "إيرادات الرسوم الدراسية", type: "revenue", code: "401", isSystemAccount: true, isGroupAccount: false, normalBalance: "credit" },
  { id: "ACC-402", name: "إيرادات رسوم التسجيل", type: "revenue", code: "402", isSystemAccount: true, isGroupAccount: false, normalBalance: "credit" },
  { id: "ACC-403", name: "إيرادات الأنشطة والخدمات", type: "revenue", code: "403", isSystemAccount: true, description: "تشمل النقل، الزي، الكتب", isGroupAccount: false, normalBalance: "credit" },
  { id: "ACC-501", name: "الرواتب والأجور", type: "expense", code: "501", isSystemAccount: true, isGroupAccount: false, normalBalance: "debit" },
  { id: "ACC-502", name: "المصروفات التشغيلية", type: "expense", code: "502", isSystemAccount: true, description: "الصيانة، الفواتير، المشتريات", isGroupAccount: false, normalBalance: "debit" },
];

const initialJournalEntries: JournalEntry[] = [];
const initialJournalLines: JournalLine[] = [];

const initialAcademicYears: AcademicYear[] = [
  { id: "Y-1000", name: "١٤٤٤ هـ", startDate: "2022-08-21", endDate: "2023-06-12", isCurrent: false },
  { id: "Y-1001", name: "١٤٤٥ هـ", startDate: "2023-08-20", endDate: "2024-06-10", isCurrent: false },
  { id: "Y-1002", name: "١٤٤٦ هـ", startDate: "2024-08-18", endDate: "2025-06-15", isCurrent: true },
];

const initialTeachingAssignments: TeachingAssignment[] = [];
const initialScheduleSlots: ScheduleSlot[] = [];

const initialMaintenanceRequests: MaintenanceRequest[] = [
  { id: "MR-1001", title: "إصلاح مكيف", description: "مكيف معطل في المعمل", location: "معمل الحاسب", priority: "high", status: "new", costEstimate: 500, dateRequested: "2023-10-20" }
];
const initialStaffEvaluations: StaffEvaluation[] = [
  { id: "SE-1001", staffId: "EMP-1001", staffName: "خالد عبدالرحمن", period: "الفصل الأول", evaluator: "المدير", date: "2023-11-01", criteria: { commitment: 5, performance: 4, cooperation: 5, creativity: 4 }, overallScore: 4.5, notes: "أداء ممتاز" }
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
  allStudentEnrollments: StudentEnrollment[];
  allEmployeeAssignments: EmployeeAssignment[];
  allInvoices: Invoice[];
  allFeeStructures: FeeStructure[];
  allDiscounts: Discount[];
  allPayments: Payment[];
  allExpenses: Expense[];
  allVendors: Vendor[];
  allExpenseCategories: ExpenseCategory[];
  allTreasuries: Treasury[];
  allBankAccounts: BankAccount[];
  allCashSessions: CashSession[];
  openCashSession: (treasuryId: string, userId: string, openingBalance: number) => void;
  closeCashSession: (sessionId: string, closingBalance: number) => void;

  allAccounts: Account[];
  allJournalEntries: JournalEntry[];
  allJournalLines: JournalLine[];
  addJournalEntry: (entry: Omit<JournalEntry, "id">, lines?: Omit<JournalLine, "id" | "journalEntryId">[]) => void;
  allAuditLogs: AuditLog[];
  allBooks: Book[];
  allLibraryIssues: LibraryIssue[];
  allInventoryItems: InventoryItem[];
  allInventoryTransactions: InventoryTransaction[];
  allStaff: Staff[];
  allClinicVisits: ClinicVisit[];
  allDisciplineIncidents: DisciplineIncident[];
  allAttendanceSessions: AttendanceSession[];
  allAttendanceRecords: AttendanceRecord[];
  allAttendanceExcuses: AttendanceExcuse[];
  allBehaviorTransactions: BehaviorTransaction[];
  allDisciplineCategories: DisciplineCategory[];
  allDisciplineActions: DisciplineAction[];
  allSections: Section[];
  assignSectionToRoom: (sectionId: string, roomId?: string) => void;
  allExams: Exam[];
  allExamSubjects: ExamSubject[];
  allExamResults: ExamResult[];
  allSubjects: Subject[];
  allScheduleSlots: ScheduleSlot[];
  allAcademicYears: AcademicYear[];
  allTeachingAssignments: TeachingAssignment[];

  
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
  activeStageExamSubjects: ExamSubject[];
  activeStageSubjects: Subject[];
  activeStageScheduleSlots: ScheduleSlot[];
  activeStageTeachingAssignments: TeachingAssignment[];


  // Actions
  addStudent: (student: Omit<Student, "id">) => string;
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
  addInvoice: (invoiceData: Omit<Invoice, "id" | "paid" | "status"> & { status?: Invoice["status"] }) => void;
  issueInvoice: (id: string) => void;
  cancelInvoice: (id: string) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addFeeStructure: (feeData: Omit<FeeStructure, "id">) => void;
  updateFeeStructure: (id: string, updates: Partial<FeeStructure>) => void;
  deleteFeeStructure: (id: string) => void;
  addDiscount: (discountData: Omit<Discount, "id">) => void;
  updateDiscount: (id: string, updates: Partial<Discount>) => void;
  deleteDiscount: (id: string) => void;
  addPayment: (paymentData: Omit<Payment, "id">) => void;
  addExpense: (expenseData: Omit<Expense, "id"> & { status?: Expense["status"] }) => void;
  addVendor: (vendor: any) => void;
  payVendor: (vendorId: string, amount: number) => void;
  submitExpense: (id: string) => void;
  approveExpense: (id: string) => void;
  postExpense: (id: string) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addAccount: (account: Omit<Account, "id">) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  toggleAccountStatus: (id: string) => void;
  rolloverFinancialBalances: (fromYearId: string, toYearId: string) => void;
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;

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
  addDisciplineIncident: (incident: Omit<DisciplineIncident, "id">) => void;
  addAttendanceSession: (session: Omit<AttendanceSession, "id">, records: Omit<AttendanceRecord, "id" | "sessionId">[]) => void;
  addBehaviorTransaction: (transaction: Omit<BehaviorTransaction, "id">) => void;
  addSection: (section: Omit<Section, "id">) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  deleteSection: (id: string) => void;
  
  currency: string;
  setCurrency: (c: string) => void;
  
  addExam: (exam: Omit<Exam, "id">) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  
  addExamSubject: (examSubject: Omit<ExamSubject, "id">) => void;
  updateExamSubject: (id: string, updates: Partial<ExamSubject>) => void;
  deleteExamSubject: (id: string) => void;
  
  saveExamResults: (results: Omit<ExamResult, "id">[]) => void;

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
  promoteStaff: (promotions: { employeeId: string; nextRole: string; nextAcademicYearId: string; status: "active" | "on_leave" | "terminated"; basicSalary: number }[]) => void;
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

  currentAcademicYearId: string | undefined;
}

const GlobalStoreContext = createContext<GlobalStoreContextType | undefined>(undefined);

export function GlobalStoreProvider({ children }: { children: ReactNode }) {
  const { stage: activeStage } = useStage();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>(initialStudentEnrollments);
  const [deletedStudents, setDeletedStudents] = useState<Student[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>(initialGuardians);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(initialFeeStructures);
  const [discounts, setDiscounts] = useState<Discount[]>(initialDiscounts);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("erp_vendors") : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem("erp_vendors", JSON.stringify(vendors));
  }, [vendors]);
  const [expenseCategories] = useState<ExpenseCategory[]>(initialExpenseCategories);
  const [treasuries, setTreasuries] = useState<Treasury[]>(initialTreasuries);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [cashSessions, setCashSessions] = useState<CashSession[]>(initialCashSessions);

  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [libraryIssues, setLibraryIssues] = useState<LibraryIssue[]>(initialLibraryIssues);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initialInventoryItems);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(initialInventoryTransactions);
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [employeeAssignments, setEmployeeAssignments] = useState<EmployeeAssignment[]>(initialEmployeeAssignments);
  const [clinicVisits, setClinicVisits] = useState<ClinicVisit[]>(initialClinicVisits);
  const [disciplineIncidents, setDisciplineIncidents] = useState<DisciplineIncident[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceExcuses, setAttendanceExcuses] = useState<AttendanceExcuse[]>([]);
  const [behaviorTransactions, setBehaviorTransactions] = useState<BehaviorTransaction[]>([]);
  const [disciplineCategories, setDisciplineCategories] = useState<DisciplineCategory[]>([
    { id: "DC-01", name: "غياب متكرر", type: "behavioral", severity: "medium", defaultPoints: -3, recommendedAction: "إنذار أول" },
    { id: "DC-02", name: "شغب في الفصل", type: "behavioral", severity: "high", defaultPoints: -5, recommendedAction: "استدعاء ولي الأمر" },
    { id: "DC-03", name: "تأخر دراسي", type: "academic", severity: "low", defaultPoints: -1, recommendedAction: "تنبيه" },
    { id: "DC-04", name: "مشاركة متميزة", type: "behavioral", severity: "low", defaultPoints: 5, recommendedAction: "شكر" },
    { id: "DC-05", name: "تفوق أكاديمي", type: "academic", severity: "high", defaultPoints: 10, recommendedAction: "شهادة تقدير" }
  ]);
  const [disciplineActions, setDisciplineActions] = useState<DisciplineAction[]>([]);
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>(initialExamSubjects);
  const [examResults, setExamResults] = useState<ExamResult[]>(initialExamResults);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialJournalEntries);
  const [journalLines, setJournalLines] = useState<JournalLine[]>(initialJournalLines);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currency, setCurrency] = useState(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_currency") : null;
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
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_system_settings") : null;
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

  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>(initialTransportRoutes);
  const [transportSubscriptions, setTransportSubscriptions] = useState<TransportSubscription[]>(initialTransportSubscriptions);



  const [timetableSettings, setTimetableSettings] = useState<TimetableSettings>({
    maxPeriodsPerDay: 7,
    breakDuration: 45,
    periodDuration: 45,
    stage: "all"
  });

  const currentAcademicYearId = useMemo(() => academicYears.find(y => y.isCurrent)?.id, [academicYears]);

  // Derived state filtered by the global active stage and active year
  const activeStageStudents = useMemo(() => {
    return studentEnrollments
      .filter(e => e.academicYearId === currentAcademicYearId && e.stage === activeStage)
      .map(e => {
        const studentIdentity = students.find(s => s.id === e.studentId);
        return { ...studentIdentity, ...e } as Student;
      });
  }, [studentEnrollments, students, currentAcademicYearId, activeStage]);
  
  const allDeletedStudents = useMemo(() => students.filter(s => s.isDeleted), [students]);
  const activeStageInvoices = useMemo(() => invoices.filter(inv => inv.stage === activeStage), [invoices, activeStage]);
  const activeStageFeeStructures = useMemo(() => feeStructures.filter(f => f.stage === "all" || f.stage === activeStage), [feeStructures, activeStage]);
  const activeStageBooks = useMemo(() => books.filter(b => b.stage === activeStage), [books, activeStage]);
  const activeStageLibraryIssues = useMemo(() => libraryIssues.filter(li => li.stage === activeStage), [libraryIssues, activeStage]);
  
  const activeStageStaff = useMemo(() => {
    return employeeAssignments
      .filter(a => a.academicYearId === currentAcademicYearId && (a.stage === activeStage || a.stage === "all"))
      .map(a => {
        const employeeIdentity = staff.find(s => s.id === a.employeeId);
        return { ...employeeIdentity, ...a } as Staff;
      });
  }, [employeeAssignments, staff, currentAcademicYearId, activeStage]);
  const activeStageStaffAttendance = useMemo(() => staffAttendance.filter(sa => activeStageStaff.some(s => s.id === sa.staffId)), [staffAttendance, activeStageStaff]);
  const activeStageClinicVisits = useMemo(() => clinicVisits.filter(cv => cv.stage === activeStage), [clinicVisits, activeStage]);
  const activeStageDisciplineIncidents = useMemo(() => {
    return disciplineIncidents.filter(di => {
      const enrollment = studentEnrollments.find(e => e.id === di.studentEnrollmentId);
      return enrollment && enrollment.stage === activeStage;
    });
  }, [disciplineIncidents, studentEnrollments, activeStage]);
  const activeStageSections = useMemo(() => {
    return sections
      .filter(sec => sec.stage === activeStage)
      .sort((a, b) => {
        const indexA = GRADE_OPTIONS[activeStage].indexOf(a.grade);
        const indexB = GRADE_OPTIONS[activeStage].indexOf(b.grade);
        if (indexA !== indexB) return indexA - indexB;
        return a.name.localeCompare(b.name);
      });
  }, [sections, activeStage]);
  const activeStageExams = useMemo(() => exams.filter(ex => ex.academicYearId === currentAcademicYearId), [exams, currentAcademicYearId]);
  const activeStageExamSubjects = useMemo(() => examSubjects.filter(sub => sub.stage === activeStage || sub.stage === "all"), [examSubjects, activeStage]);
  const activeStageSubjects = useMemo(() => subjects.filter(sub => sub.stage === activeStage || sub.stage === "all"), [subjects, activeStage]);
  const activeStageScheduleSlots = useMemo(() => scheduleSlots.filter(s => s.stage === activeStage), [scheduleSlots, activeStage]);
  const activeStageTeachingAssignments = useMemo(() => teachingAssignments.filter(ta => ta.stage === activeStage), [teachingAssignments, activeStage]);



  const activeStageTextbooks = useMemo(() => textbooks.filter(t => t.stage === activeStage), [textbooks, activeStage]);
  const activeStageDistributions = useMemo(() => textbookDistributions.filter(d => d.stage === activeStage), [textbookDistributions, activeStage]);
  const activeStageTimetableSettings = useMemo(() => timetableSettings.stage === activeStage || timetableSettings.stage === "all" ? timetableSettings : timetableSettings, [timetableSettings, activeStage]);

  // --- Actions ---
  const addStudent = (studentData: Omit<Student, "id">): string => {
    const existingStudent = students.find(s => s.nationalId === studentData.nationalId);
    const newStudentId = existingStudent ? existingStudent.id : `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    
    if (!existingStudent) {
      const newStudent = { ...studentData, id: newStudentId } as Student;
      setStudents((prev) => [newStudent, ...prev]);
    }

    const newEnrollment: StudentEnrollment = {
      id: `ENR-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: newStudentId,
      academicYearId: currentAcademicYearId || "",
      stage: studentData.stage,
      grade: studentData.grade,
      sectionId: studentData.sectionId,
      status: studentData.status || "نشط",
      enrollmentDate: new Date().toISOString().split("T")[0],
      major: studentData.major,
      elective: studentData.elective
    };
    setStudentEnrollments(prev => [newEnrollment, ...prev]);

    return newStudentId;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    setStudentEnrollments(prev => prev.map(e => (e.studentId === id && e.academicYearId === currentAcademicYearId) ? { ...e, ...updates } as StudentEnrollment : e));
  };

  const softDeleteStudent = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isDeleted: true, deletedAt: new Date().toISOString() } : s));
  };

  const restoreStudent = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isDeleted: false, deletedAt: undefined } : s));
  };

  const hardDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setStudentEnrollments(prev => prev.filter(e => e.studentId !== id));
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
    setStudentEnrollments(prev => prev.map(e => (e.studentId === studentId && e.academicYearId === currentAcademicYearId) ? { ...e, sectionId } : e));
  };

  const promoteStudents = (promotions: { studentId: string; nextGrade: string; nextAcademicYearId: string; status: "ناجح" | "راسب" | "منقول" | "خريج" }[]) => {
    setStudentEnrollments(prev => {
      let updated = [...prev];
      promotions.forEach(promo => {
        const currentEnr = updated.find(e => e.studentId === promo.studentId && e.academicYearId === currentAcademicYearId);
        
        if (currentEnr) {
           currentEnr.status = promo.status;
        }

        updated.push({
          id: `ENR-${Math.floor(1000 + Math.random() * 9000)}`,
          studentId: promo.studentId,
          academicYearId: promo.nextAcademicYearId,
          stage: currentEnr?.stage || "primary",
          grade: promo.nextGrade,
          status: promo.status === "خريج" ? "خريج" : "نشط",
          enrollmentDate: new Date().toISOString().split("T")[0]
        });
      });
      return updated;
    });
  };

  const promoteStaff = (promotions: { employeeId: string; nextRole: string; nextAcademicYearId: string; status: "active" | "on_leave" | "terminated"; basicSalary: number }[]) => {
    setEmployeeAssignments(prev => {
      let updated = [...prev];
      promotions.forEach(promo => {
        const currentAssgn = updated.find(e => e.employeeId === promo.employeeId && e.academicYearId === currentAcademicYearId);
        
        if (currentAssgn && promo.status !== "active") {
           currentAssgn.status = promo.status;
        }

        if (promo.status !== "terminated") {
          updated.push({
            id: `EMP-ASSGN-${Math.floor(1000 + Math.random() * 9000)}`,
            employeeId: promo.employeeId,
            academicYearId: promo.nextAcademicYearId,
            role: promo.nextRole,
            department: currentAssgn?.department || "General",
            status: promo.status,
            basicSalary: promo.basicSalary,
            stage: currentAssgn?.stage || "all"
          });
        }
      });
      return updated;
    });
  };

  // --- Finance Methods ---
  const addInvoice = (invoiceData: Omit<Invoice, "id" | "paid" | "status"> & { status?: Invoice["status"] }) => {
    const id = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInvoice: Invoice = { ...invoiceData, id, paid: 0, status: invoiceData.status || "issued" };
    setInvoices(prev => [newInvoice, ...prev]);

    // Create Journal Entry ONLY if issued
    if (newInvoice.status === "issued") {
      const jId = `JE-${Math.floor(10000 + Math.random() * 90000)}`;
      const je: JournalEntry = {
        id: jId,
        academicYearId: currentAcademicYearId || "",
        date: newInvoice.issueDate || new Date().toISOString().split("T")[0],
        referenceId: id,
        referenceType: "invoice",
        description: `استحقاق ${newInvoice.title} للطالب ${newInvoice.studentName}`,
        status: "posted",
        isAutoGenerated: true,
        sourceDocumentType: "invoice",
        sourceDocumentId: id
      };
      
      const amount = newInvoice.netAmount ?? newInvoice.amount;
      const jl1: JournalLine = { id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId, accountId: "ACC-103", debit: amount, credit: 0, studentId: newInvoice.studentId, referenceId: newInvoice.studentId, referenceType: 'student' };
      const jl2: JournalLine = { id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId, accountId: "ACC-401", debit: 0, credit: amount, studentId: newInvoice.studentId, referenceId: newInvoice.studentId, referenceType: 'student' };
      
      setJournalEntries(prev => [je, ...prev]);
      setJournalLines(prev => [jl1, jl2, ...prev]);
    }
  };

  const issueInvoice = (id: string) => {
    const invoice = invoices.find(i => i.id === id);
    if (!invoice || invoice.status !== "draft") return;

    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "issued", issueDate: new Date().toISOString().split('T')[0] } : inv));

    // Create Journal Entry
    const jId = `JE-${Math.floor(10000 + Math.random() * 90000)}`;
    const je: JournalEntry = {
      id: jId,
      academicYearId: currentAcademicYearId || "",
      date: new Date().toISOString().split("T")[0],
      referenceId: id,
      referenceType: "invoice",
      description: `استحقاق ${invoice.title} للطالب ${invoice.studentName}`,
      status: "posted",
      isAutoGenerated: true,
      sourceDocumentType: "invoice",
      sourceDocumentId: id
    };
    
    const amount = invoice.netAmount ?? invoice.amount;
    const jl1: JournalLine = { id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId, accountId: "ACC-103", debit: amount, credit: 0, studentId: invoice.studentId, referenceId: invoice.studentId, referenceType: 'student' };
    const jl2: JournalLine = { id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId, accountId: "ACC-401", debit: 0, credit: amount, studentId: invoice.studentId, referenceId: invoice.studentId, referenceType: 'student' };
    
    setJournalEntries(prev => [je, ...prev]);
    setJournalLines(prev => [jl1, jl2, ...prev]);
  };

  const cancelInvoice = (id: string) => {
    const invoice = invoices.find(i => i.id === id);
    if (!invoice || invoice.status === "cancelled" || invoice.paid > 0) return; // Cannot cancel paid invoices directly without a credit note
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "cancelled" } : inv));
    
    // Reverse Journal Entry if it was issued
    if (invoice.status === "issued") {
      const jId = `JE-${Math.floor(10000 + Math.random() * 90000)}`;
      const je: JournalEntry = {
        id: jId,
        academicYearId: currentAcademicYearId || "",
        date: new Date().toISOString().split("T")[0],
        referenceId: id,
        referenceType: "invoice",
        description: `إلغاء استحقاق ${invoice.title} للطالب ${invoice.studentName}`,
        status: "posted",
        isAutoGenerated: true,
        sourceDocumentType: "invoice",
        sourceDocumentId: id
      };
      
      const amount = invoice.netAmount ?? invoice.amount;
      const jl1: JournalLine = { id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId, accountId: "ACC-103", debit: 0, credit: amount, studentId: invoice.studentId, referenceId: invoice.studentId, referenceType: 'student' }; // Credit AR
      const jl2: JournalLine = { id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId, accountId: "ACC-401", debit: amount, credit: 0, studentId: invoice.studentId, referenceId: invoice.studentId, referenceType: 'student' }; // Debit Revenue
      
      setJournalEntries(prev => [je, ...prev]);
      setJournalLines(prev => [jl1, jl2, ...prev]);
    }
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        const updated = { ...inv, ...updates };
        // Status overrides only apply if not draft or cancelled
        if (updated.status !== "draft" && updated.status !== "cancelled") {
          if (updated.paid >= (updated.netAmount || updated.amount)) {
            updated.status = "paid";
          } else if (updated.paid > 0) {
            updated.status = "partial";
          } else {
            updated.status = "issued";
          }
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

  const addJournalEntry = (entry: Omit<JournalEntry, "id">, lines?: Omit<JournalLine, "id" | "journalEntryId">[]) => {
    const jId = `JE-${Math.floor(10000 + Math.random() * 90000)}`;
    const je = { ...entry, id: jId } as JournalEntry;
    setJournalEntries(prev => [je, ...prev]);
    
    if (lines && lines.length > 0) {
      const jLines = lines.map(l => ({ ...l, id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId } as JournalLine));
      setJournalLines(prev => [...jLines, ...prev]);
    }
  };

  const addAccount = (account: Omit<Account, "id">) => {
    const newAcc = { ...account, id: `ACC-${Math.floor(1000 + Math.random() * 9000)}`, isActive: true } as Account;
    setAccounts(prev => [...prev, newAcc]);
    addAuditLog({ action: "create", details: `حساب جديد: ${account.name}`, entityType: 'system', entityId: newAcc.id, userId: 'SYS', userName: 'المستخدم الحالي' });
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    addAuditLog({ action: "update", details: `تحديث بيانات الحساب ${id}`, entityType: 'system', entityId: id, userId: 'SYS', userName: 'المستخدم الحالي' });
  };

  const deleteAccount = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (acc?.isSystemAccount) return;
    setAccounts(prev => prev.filter(a => a.id !== id));
    addAuditLog({ action: "delete", details: `تم حذف الحساب ${id}`, entityType: 'system', entityId: id, userId: 'SYS', userName: 'المستخدم الحالي' });
  };

  const toggleAccountStatus = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (acc?.isSystemAccount) return;
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, isActive: !(a.isActive ?? true) } : a));
    addAuditLog({ action: "update", details: `تغيير حالة الحساب ${id}`, entityType: 'system', entityId: id, userId: 'SYS', userName: 'المستخدم الحالي' });
  };

  const rolloverFinancialBalances = (fromYearId: string, toYearId: string) => {
    // Calculate balances for each student in fromYearId
    const entriesFrom = journalEntries.filter(e => e.academicYearId === fromYearId);
    const entryIds = new Set(entriesFrom.map(e => e.id));
    const arLines = journalLines.filter(l => entryIds.has(l.journalEntryId) && l.accountId === "ACC-103" && l.studentId);
    
    const balances: Record<string, number> = {};
    for (const l of arLines) {
      if (!l.studentId) continue;
      balances[l.studentId] = (balances[l.studentId] || 0) + (l.debit - l.credit);
    }
    
    // Create Opening Balance Entry in toYearId
    const jId = `JE-${Math.floor(10000 + Math.random() * 90000)}`;
    const je: JournalEntry = {
      id: jId,
      academicYearId: toYearId,
      date: new Date().toISOString().split("T")[0],
      referenceType: "manual",
      description: "رصيد افتتاحي مرحل من السنة السابقة",
      status: "posted"
    };

    let totalDebit = 0;
    let totalCredit = 0;
    const lines: JournalLine[] = [];
    
    for (const [studentId, balance] of Object.entries(balances)) {
      if (balance === 0) continue;
      const jlId = `JL-${Math.floor(10000 + Math.random() * 90000)}`;
      if (balance > 0) {
        lines.push({ id: jlId, journalEntryId: jId, accountId: "ACC-103", debit: balance, credit: 0, studentId });
        totalDebit += balance;
      } else {
        lines.push({ id: jlId, journalEntryId: jId, accountId: "ACC-103", debit: 0, credit: -balance, studentId });
        totalCredit += -balance;
      }
    }
    
    if (lines.length > 0) {
      // Balance the entry with Retained Earnings or a general Opening Balance account. 
      // For simplicity, we credit/debit Retained Earnings/Equity (assume ACC-101 for now or a new one)
      const diff = totalDebit - totalCredit;
      const jlBalId = `JL-${Math.floor(10000 + Math.random() * 90000)}`;
      if (diff > 0) {
         lines.push({ id: jlBalId, journalEntryId: jId, accountId: "ACC-402", debit: 0, credit: diff }); // Credit some account to balance
      } else if (diff < 0) {
         lines.push({ id: jlBalId, journalEntryId: jId, accountId: "ACC-402", debit: -diff, credit: 0 }); // Debit some account to balance
      }
      
      setJournalEntries(prev => [je, ...prev]);
      setJournalLines(prev => [...lines, ...prev]);
    }
  };

  const addAuditLog = (logData: Omit<AuditLog, "id" | "timestamp">) => {
    const newLog: AuditLog = {
      ...logData,
      id: `AL-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addExpense = (expenseData: Omit<Expense, "id"> & { status?: Expense["status"] }) => {
    const id = `EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newExpense: Expense = { ...expenseData, id, status: expenseData.status || "draft" };
    setExpenses(prev => [newExpense, ...prev]);

    // Create Journal Entry only if posted immediately (e.g. automated HR processes might pass status="posted")
    if (newExpense.status === "posted") {
      const jId = `JE-${Math.floor(10000 + Math.random() * 90000)}`;
      const je: JournalEntry = {
        id: jId,
        academicYearId: currentAcademicYearId || "",
        date: newExpense.date,
        referenceId: id,
        referenceType: "expense",
        description: `صرف ${newExpense.title} - المستفيد: ${newExpense.beneficiary}`,
        status: "posted",
        isAutoGenerated: true,
        sourceDocumentType: "expense",
        sourceDocumentId: id
      };
      
      const amount = newExpense.amount;
      const creditAcc = newExpense.method === 'cash' ? 'ACC-101' : 'ACC-102';
      const jl1: JournalLine = { id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId, accountId: "ACC-502", debit: amount, credit: 0 };
      const jl2: JournalLine = { id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId, accountId: creditAcc, debit: 0, credit: amount };
      
      setJournalEntries(prev => [je, ...prev]);
      setJournalLines(prev => [jl1, jl2, ...prev]);
    }
  };

  const addVendor = (vendor: any) => setVendors(prev => [...prev, { ...vendor, id: `VEN-${Math.random().toString(36).substr(2, 9)}` }]);
  const payVendor = (vendorId: string, amount: number) => { /* Logic here */ };

  const submitExpense = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id && (e.status === "draft" || !e.status) ? { ...e, status: "submitted" } : e));
  };

  const approveExpense = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id && e.status === "submitted" ? { ...e, status: "approved" } : e));
  };

  const postExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense || expense.status !== "approved") return;

    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: "posted" } : e));

    // Create Journal Entry
    const jId = `JE-${Math.floor(10000 + Math.random() * 90000)}`;
    const je: JournalEntry = {
      id: jId,
      academicYearId: currentAcademicYearId || "",
      date: new Date().toISOString().split("T")[0], // Date of posting
      referenceId: id,
      referenceType: "expense",
      description: `ترحيل مصروف: ${expense.title} - المستفيد: ${expense.beneficiary}`,
      status: "posted",
      isAutoGenerated: true,
      sourceDocumentType: "expense",
      sourceDocumentId: id
    };
    
    const amount = expense.amount;
    const creditAcc = expense.method === 'cash' ? 'ACC-101' : 'ACC-102';
    const jl1: JournalLine = { id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId, accountId: "ACC-502", debit: amount, credit: 0 };
    const jl2: JournalLine = { id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId, accountId: creditAcc, debit: 0, credit: amount };
    
    setJournalEntries(prev => [je, ...prev]);
    setJournalLines(prev => [jl1, jl2, ...prev]);
  };
  const updateExpense = (id: string, updates: Partial<Expense>) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  const deleteExpense = (id: string) => setExpenses(prev => prev.filter(e => e.id !== id));
  const openCashSession = (treasuryId: string, userId: string, openingBalance: number) => {
    const id = `CS-${Math.floor(1000 + Math.random() * 9000)}`;
    setCashSessions(prev => [{ id, treasuryId, userId, openedAt: new Date().toISOString(), status: 'open', openingBalance }, ...prev]);
  };
  const closeCashSession = (sessionId: string, closingBalance: number) => {
    setCashSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'closed', closedAt: new Date().toISOString(), closingBalance } : s));
  };

  const addPayment = (paymentData: Omit<Payment, "id">) => {
    const { method, amount, invoiceId, studentId } = paymentData;
    const paymentId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    const payment: Payment = {
      ...paymentData,
      id: paymentId,
      date: paymentData.date || new Date().toISOString().split("T")[0]
    };
    
    setPayments(prev => [payment, ...prev]);

    // Create Journal Entry
    const jId = `JE-${Math.floor(10000 + Math.random() * 90000)}`;
    const je: JournalEntry = {
      id: jId,
      academicYearId: currentAcademicYearId || "",
      date: payment.date,
      referenceId: paymentId,
      referenceType: "payment",
      description: `سداد للرقم المرجعي ${paymentData.referenceNo || paymentData.invoiceId || "عام"}`,
      status: "posted",
      isAutoGenerated: true,
      sourceDocumentType: "payment",
      sourceDocumentId: paymentId
    };
    
    // Debit Cash/Bank (ACC-101 / ACC-102), Credit AR (ACC-103)
    const debitAcc = method === 'cash' ? 'ACC-101' : 'ACC-102';
    const jl1: JournalLine = { id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId, accountId: debitAcc, debit: amount, credit: 0 };
    const jl2: JournalLine = { id: `JL-${Math.floor(10000 + Math.random() * 90000)}`, journalEntryId: jId, accountId: "ACC-103", debit: 0, credit: amount, studentId, referenceId: studentId, referenceType: 'student' };
    
    setJournalEntries(prev => [je, ...prev]);
    setJournalLines(prev => [jl1, jl2, ...prev]);

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newPaid = inv.paid + amount;
          const targetAmount = inv.netAmount ?? inv.amount;
          return {
            ...inv,
            paid: newPaid,
            status: newPaid >= targetAmount ? "paid" : newPaid > 0 ? "partial" : "issued",
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
    const existingStaff = staff.find(s => s.employeeNo && s.employeeNo === staffData.employeeNo);
    const newStaffId = existingStaff ? existingStaff.id : `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!existingStaff) {
      const newStaff = { ...staffData, id: newStaffId } as Staff;
      setStaff(prev => [newStaff, ...prev]);
    }

    const newAssignment: EmployeeAssignment = {
      id: `EA-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId: newStaffId,
      academicYearId: currentAcademicYearId || "",
      stage: staffData.stage,
      role: staffData.role,
      department: staffData.department,
      status: staffData.status,
      basicSalary: staffData.basicSalary,
      allowance: staffData.allowance,
      deduction: staffData.deduction,
      paymentType: staffData.paymentType,
      rate: staffData.rate,
      subjects: staffData.subjects,
      sections: staffData.sections
    };
    setEmployeeAssignments(prev => [newAssignment, ...prev]);
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
    setEmployeeAssignments(prev => prev.map(a => (a.employeeId === id && a.academicYearId === currentAcademicYearId) ? { ...a, ...updates } as EmployeeAssignment : a));
  };

  const softDeleteStaff = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, isDeleted: true, deletedAt: new Date().toISOString() } : s));
  };

  const restoreStaff = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, isDeleted: false, deletedAt: undefined } : s));
  };

  const hardDeleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    setEmployeeAssignments(prev => prev.filter(a => a.employeeId !== id));
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

  const addDisciplineIncident = (incidentData: Omit<DisciplineIncident, "id">) => {
    const newIncident: DisciplineIncident = {
      ...incidentData,
      id: `DI-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setDisciplineIncidents(prev => [newIncident, ...prev]);
  };

  const addAttendanceSession = (sessionData: Omit<AttendanceSession, "id">, recordsData: Omit<AttendanceRecord, "id" | "sessionId">[]) => {
    const sessionId = `AS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSession: AttendanceSession = { ...sessionData, id: sessionId };
    
    const newRecords = recordsData.map(r => ({
      ...r,
      id: `AR-${Math.floor(10000 + Math.random() * 90000)}`,
      sessionId
    }));

    setAttendanceSessions(prev => [newSession, ...prev]);
    setAttendanceRecords(prev => [...newRecords, ...prev]);

    // Automatically generate warnings/incidents for absent students
    recordsData.forEach(r => {
      if (r.status === "ABSENT") {
        setDisciplineIncidents(prev => [{
          id: `DI-${Math.floor(1000 + Math.random() * 9000)}`,
          studentEnrollmentId: r.studentEnrollmentId,
          date: sessionData.date,
          description: `غياب غير مبرر عن الحصة ${sessionData.periodNumber || "اليوم"}`,
          responsiblePerson: "نظام الرصد التلقائي",
          actionTaken: "إنذار غياب مبدئي"
        }, ...prev]);
      }
    });
  };

  const addBehaviorTransaction = (transactionData: Omit<BehaviorTransaction, "id">) => {
    const newTransaction: BehaviorTransaction = {
      ...transactionData,
      id: `BTX-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setBehaviorTransactions(prev => [newTransaction, ...prev]);
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

  const addExam = (examData: Omit<Exam, "id">) => {
    setExams(prev => [{ ...examData, id: `EX-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  };

  const updateExam = (id: string, updates: Partial<Exam>) => {
    setExams(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteExam = (id: string) => {
    setExams(prev => prev.filter(e => e.id !== id));
    // optionally cascade delete subjects and results...
  };

  const addExamSubject = (examSubject: Omit<ExamSubject, "id">) => {
    setExamSubjects(prev => [{ ...examSubject, id: `ES-${Math.floor(1000 + Math.random() * 9000)}` }, ...prev]);
  };

  const updateExamSubject = (id: string, updates: Partial<ExamSubject>) => {
    setExamSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteExamSubject = (id: string) => {
    setExamSubjects(prev => prev.filter(s => s.id !== id));
  };

  const saveExamResults = (newResults: Omit<ExamResult, "id">[]) => {
    setExamResults(prev => {
      let updated = [...prev];
      for (const r of newResults) {
        const existingIdx = updated.findIndex(exr => exr.examSubjectId === r.examSubjectId && exr.studentEnrollmentId === r.studentEnrollmentId);
        if (existingIdx >= 0) {
          updated[existingIdx] = { ...updated[existingIdx], mark: r.mark, notes: r.notes, status: r.status };
        } else {
          updated.push({ ...r, id: `ER-${Math.floor(1000 + Math.random() * 9000)}` });
        }
      }
      return updated;
    });
  };

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
      newState = newState.map(y => y.id === id ? { ...y, ...updates } : y);
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

  const assignSectionToRoom = (sectionId: string, roomId?: string) => {
    const targetSection = sections.find(s => s.id === sectionId);
    if (!targetSection) return;

    if (!roomId) {
      const oldRoomId = targetSection.roomId;
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, roomId: undefined, roomName: undefined } : s));
      if (oldRoomId) {
        setRooms(prev => prev.map(r => r.id === oldRoomId ? { ...r, assignedSectionId: undefined, assignedSectionName: undefined, status: "available" } : r));
      }
      return;
    }

    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    const oldRoomIdOfSection = targetSection.roomId;
    const oldSectionIdOfRoom = targetRoom.assignedSectionId;

    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        return { ...s, roomId: targetRoom.id, roomName: targetRoom.name };
      }
      if (oldSectionIdOfRoom && s.id === oldSectionIdOfRoom) {
        return { ...s, roomId: undefined, roomName: undefined };
      }
      return s;
    }));

    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        return { ...r, assignedSectionId: targetSection.id, assignedSectionName: `${targetSection.grade} - شعبة ${targetSection.name}`, status: "occupied" };
      }
      if (oldRoomIdOfSection && r.id === oldRoomIdOfSection) {
        return { ...r, assignedSectionId: undefined, assignedSectionName: undefined, status: "available" };
      }
      return r;
    }));
  };

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
    const gradesMap: Record<EducationalStage, string[]> = {
      kindergarten: ["مستوى أول", "مستوى ثاني"],
      primary: ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع", "الصف الخامس", "الصف السادس"],
      middle: ["الصف الأول المتوسط", "الصف الثاني المتوسط", "الصف الثالث المتوسط"],
      high: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"],
    };

    const newStudents: Student[] = [];
    const newEnrollments: StudentEnrollment[] = [];
    const newInvoices: Invoice[] = [];
    const newPayments: Payment[] = [];
    const newClinicVisits: ClinicVisit[] = [];
    const newLibraryIssues: LibraryIssue[] = [];

    const activeYearId = currentAcademicYearId || "Y-1002";
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const availableGrades = gradesMap[stage];
      const grade = availableGrades[Math.floor(Math.random() * availableGrades.length)];
      const name = `${names[Math.floor(Math.random() * names.length)]} ${names[Math.floor(Math.random() * names.length)]} ${family[Math.floor(Math.random() * family.length)]}`;
      const id = `STU-BLK-${i}-${now}`;
      
      const matchedSection = sections.find(s => s.stage === stage && s.grade === grade);

      newStudents.push({
        id,
        name,
        dob: "2012-05-15",
        nationalId: `1${Math.floor(100000000 + Math.random() * 900000000)}`,
        guardianName: `والد ${name}`,
        stage,
        grade,
        sectionId: matchedSection?.id,
        status: "نشط",
        gender: Math.random() > 0.5 ? "ذكر" : "أنثى"
      });

      newEnrollments.push({
        id: `ENR-BLK-${i}-${now}`,
        studentId: id,
        academicYearId: activeYearId,
        stage,
        grade,
        sectionId: matchedSection?.id,
        status: "نشط",
        enrollmentDate: new Date().toISOString().split("T")[0]
      });

      const tuitionAmount = stage === "high" ? 8000 : stage === "middle" ? 6000 : 5000;
      const isPaid = Math.random() > 0.4;
      const isPartial = !isPaid && Math.random() > 0.5;
      const paidAmount = isPaid ? tuitionAmount : isPartial ? tuitionAmount / 2 : 0;
      const invId = `INV-BLK-${i}-${now}`;

      newInvoices.push({
        id: invId,
        studentId: id,
        studentName: name,
        amount: tuitionAmount,
        netAmount: tuitionAmount,
        paid: paidAmount,
        dueDate: "2025-01-15",
        issueDate: "2024-09-01",
        status: isPaid ? "paid" : isPartial ? "partial" : "issued",
        stage,
        category: "tuition"
      });

      if (paidAmount > 0) {
        newPayments.push({
          id: `PAY-BLK-${i}-${now}`,
          invoiceId: invId,
          amount: paidAmount,
          date: new Date().toISOString().split("T")[0],
          method: Math.random() > 0.5 ? "cash" : "bank_transfer",
          treasuryId: "gl-treasury-main",
          referenceNo: `REC-BLK-${i}`
        });
      }

      if (Math.random() > 0.95) {
        newClinicVisits.push({
           id: `CV-BLK-${i}-${now}`,
           studentId: id,
           studentName: name,
           date: new Date().toISOString().split("T")[0],
           symptoms: "صداع وإجهاد",
           diagnosis: "راحة وفحص حرارة",
           actionTaken: "إعطاء مسكن وإبلاغ الولي",
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

    // Also generate up to 500 staff members if generating large benchmark data (count >= 500)
    let newStaff: Staff[] = [];
    let newStaffAssign: EmployeeAssignment[] = [];
    let newContracts: StaffContract[] = [];

    if (count >= 100 && staff.length < 500) {
      const targetStaffCount = Math.min(500, 500 - staff.length);
      const roles = ["معلم رياضيات", "معلم علوم", "معلم لغة عربية", "إداري شؤون طلاب", "مشرف دور", "أخصائي اجتماعي"];
      
      for (let sIdx = 0; sIdx < targetStaffCount; sIdx++) {
        const sId = `EMP-BLK-${sIdx}-${now}`;
        const sStage = stages[sIdx % stages.length];
        const sName = `${names[sIdx % names.length]} ${family[(sIdx + 1) % family.length]}`;
        const role = roles[sIdx % roles.length];
        const salary = 4000 + (sIdx % 5) * 500;

        newStaff.push({
          id: sId,
          name: sName,
          role,
          department: "الشؤون الأكاديمية",
          phone: `05${Math.floor(10000000 + Math.random() * 90000000)}`,
          email: `staff${sIdx}@school.edu`,
          stage: sStage,
          nationalId: `2${Math.floor(100000000 + Math.random() * 900000000)}`,
          hireDate: "2023-01-01",
          status: "active"
        });

        newStaffAssign.push({
          id: `EMP-ASN-${sIdx}-${now}`,
          employeeId: sId,
          academicYearId: activeYearId,
          stage: sStage,
          role,
          department: "الشؤون الأكاديمية",
          status: "active"
        });

        newContracts.push({
          id: `SC-BLK-${sIdx}-${now}`,
          staffId: sId,
          staffName: sName,
          contractType: "full_time",
          startDate: "2023-09-01",
          endDate: "2026-08-31",
          basicSalary: salary,
          allowances: 500,
          deductions: 0,
          status: "active"
        });
      }
    }

    setStudents(prev => [...newStudents, ...prev]);
    setStudentEnrollments(prev => [...newEnrollments, ...prev]);
    setInvoices(prev => [...newInvoices, ...prev]);
    setPayments(prev => [...newPayments, ...prev]);
    setClinicVisits(prev => [...newClinicVisits, ...prev]);
    setLibraryIssues(prev => [...newLibraryIssues, ...prev]);
    if (newStaff.length > 0) {
      setStaff(prev => [...newStaff, ...prev]);
      setEmployeeAssignments(prev => [...newStaffAssign, ...prev]);
      setStaffContracts(prev => [...newContracts, ...prev]);
    }
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

  const addTransportSubscription = (s: Omit<TransportSubscription, "id">) => {
    const newSubId = `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSub = { ...s, id: newSubId };
    
    setTransportSubscriptions(prev => {
      const filtered = prev.filter(item => item.studentId !== s.studentId);
      return [newSub, ...filtered];
    });

    if (s.fee && s.fee > 0) {
      const studentObj = students.find(st => st.id === s.studentId);
      const routeObj = transportRoutes.find(rt => rt.id === s.routeId);
      const directionText = s.direction === "pickup" ? "ذهاب فقط" : s.direction === "dropoff" ? "عودة فقط" : "ذهاب وعودة";
      
      setInvoices(prev => {
        const existingInv = prev.find(inv => inv.studentId === s.studentId && (inv.category === "transport" || (inv as any).type === "transport") && inv.status !== "cancelled");
        if (existingInv) {
          return prev.map(inv => inv.id === existingInv.id ? {
            ...inv,
            amount: s.fee!,
            netAmount: s.fee!,
            status: inv.paid >= s.fee! ? "paid" : inv.paid > 0 ? "partial" : "issued"
          } : inv);
        } else {
          return [{
            id: `INV-TRP-${Math.floor(10000 + Math.random() * 90000)}`,
            studentId: s.studentId,
            studentName: studentObj?.name || "طالب",
            amount: s.fee!,
            netAmount: s.fee!,
            paid: 0,
            dueDate: new Date().toISOString().split("T")[0],
            issueDate: new Date().toISOString().split("T")[0],
            status: "issued",
            stage: studentObj?.stage || "primary",
            category: "transport"
          } as any, ...prev];
        }
      });
    }
  };

  const updateTransportSubscription = (id: string, updates: Partial<TransportSubscription>) => {
    setTransportSubscriptions(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        if (updated.fee && updated.fee > 0) {
          const studentObj = students.find(st => st.id === updated.studentId);
          setInvoices(prevInv => prevInv.map(inv => {
            if (inv.studentId === updated.studentId && (inv.category === "transport" || (inv as any).type === "transport")) {
              return { ...inv, amount: updated.fee!, netAmount: updated.fee! };
            }
            return inv;
          }));
        }
        return updated;
      }
      return s;
    }));
  };

  const deleteTransportSubscription = (id: string) => {
    const subToDelete = transportSubscriptions.find(s => s.id === id);
    setTransportSubscriptions(prev => prev.filter(s => s.id !== id));
    if (subToDelete) {
      setInvoices(prev => prev.filter(inv => !(inv.studentId === subToDelete.studentId && inv.category === "transport" && inv.paid === 0)));
    }
  };

  const updateTimetableSettings = (updates: Partial<TimetableSettings>) => setTimetableSettings(prev => ({ ...prev, ...updates }));

  return (
    <GlobalStoreContext.Provider value={{
      allStudents: students,
      allDeletedStudents,
      allStudentEnrollments: studentEnrollments,
      allEmployeeAssignments: employeeAssignments,
      allInvoices: invoices, allFeeStructures: feeStructures, allDiscounts: discounts, allPayments: payments, allExpenses: expenses,
      allExpenseCategories: expenseCategories,
      allTreasuries: treasuries,
      allBankAccounts: bankAccounts,
      allCashSessions: cashSessions,
      openCashSession,
      closeCashSession,
      allAccounts: accounts,
      allJournalEntries: journalEntries,
      allJournalLines: journalLines,
      addJournalEntry,
      allAuditLogs: auditLogs,
      allBooks: books, allLibraryIssues: libraryIssues,
      allInventoryItems: inventoryItems, allInventoryTransactions: inventoryTransactions,
      allStaff: staff, allClinicVisits: clinicVisits, allDisciplineIncidents: disciplineIncidents,
      allSections: sections,
      assignSectionToRoom,
      allExams: exams, allExamSubjects: examSubjects, allExamResults: examResults, allSubjects: subjects,
      allScheduleSlots: scheduleSlots, allAcademicYears: academicYears, allTeachingAssignments: teachingAssignments,
      
      allMaintenanceRequests: maintenanceRequests, allRooms: rooms,
      allStaffEvaluations: staffEvaluations, allStaffContracts: staffContracts, allStaffLeaves: staffLeaves,
      allStaffAttendance: staffAttendance, allStaffAdvances: staffAdvances,
      allActivityLogs: activityLogs,
      allUsers: users,
      allAttendanceSessions: attendanceSessions,
      allAttendanceRecords: attendanceRecords,
      allAttendanceExcuses: attendanceExcuses,
      allBehaviorTransactions: behaviorTransactions,
      allDisciplineCategories: disciplineCategories,
      allDisciplineActions: disciplineActions,

      activeStageStudents, activeStageInvoices, activeStageFeeStructures, activeStageBooks, activeStageLibraryIssues,
      activeStageStaff, activeStageStaffAttendance, activeStageClinicVisits, activeStageDisciplineIncidents, activeStageSections,
      activeStageExams, activeStageExamSubjects, activeStageSubjects,
      activeStageScheduleSlots, activeStageTeachingAssignments,
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
      addPayment, addInvoice, issueInvoice, cancelInvoice, updateInvoice, deleteInvoice, addFeeStructure, updateFeeStructure, deleteFeeStructure, addDiscount, updateDiscount, deleteDiscount, addExpense, submitExpense, approveExpense, postExpense, updateExpense, deleteExpense, rolloverFinancialBalances,
      allVendors: vendors, addVendor, payVendor,
      addAccount, updateAccount, deleteAccount, toggleAccountStatus,
      addBook, issueBook, returnBook, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      processInventoryTransaction, addStaff, updateStaff, deleteStaff: hardDeleteStaff, upsertStaffAttendance, addStaffAdvance, addClinicVisit, addDisciplineIncident, addAttendanceSession, addBehaviorTransaction,
      addSection, updateSection, deleteSection, 

      currency,
      setCurrency,
      addExam, updateExam, deleteExam, addExamSubject, updateExamSubject, deleteExamSubject, saveExamResults, addSubject, deleteSubject,
      updateScheduleSlot, clearScheduleSlot, addAcademicYear, updateAcademicYear, addTeachingAssignment, deleteTeachingAssignment,
      assignStudentToSection,
      promoteStudents,
      promoteStaff,
      
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
      addNotification,
      addAuditLog,
      currentAcademicYearId
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
