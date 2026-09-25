import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { EducationalStage, useStage, GRADE_OPTIONS } from "./StageContext";

export interface Guardian {
  id: string;
  name: string;
  nationalId?: string;
  phone: string;
  phoneSecond?: string;
  email?: string;
  job?: string;
  relation: string;
  address?: string;
  gender?: "ذكر" | "أنثى";
  notes?: string;
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

export interface StudentGuardianLink {
  id?: string;
  name: string;
  relation: string;
  phone: string;
  phoneSecond?: string;
  email?: string;
  job?: string;
  isPrimary: boolean;
  address?: string;
  notes?: string;
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
  guardianRelationship?: string;
  guardians?: StudentGuardianLink[];
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

export interface TermConfig {
  id: string;
  name: string; // e.g. "الفصل الدراسي الأول", "الفصل الدراسي الثاني", "الفصل الدراسي الثالث", "الفصل الصيفي"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: "completed" | "active" | "upcoming";
  examStartDate?: string;
  examEndDate?: string;
  weightPercent?: number;
  notes?: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "١٤٤٥ / ١٤٤٦ هـ"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  termSystem?: "3_terms" | "2_terms" | "custom";
  activeTermId?: string;
  terms?: TermConfig[];
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
  // Comprehensive Payroll & Salary Scheme Fields
  paymentType?: "Monthly" | "Weekly" | "PerLesson" | "Hourly" | "Daily";
  rate?: number;
  stageRates?: Record<string, number>; // per lesson rate per stage
  subjectRates?: Record<string, number>; // per lesson rate per subject
  bankName?: string;
  iban?: string;
  accountNumber?: string;
  allowanceDetails?: Array<{ id: string; name: string; amount: number }>;
  deductionDetails?: Array<{ id: string; name: string; amount: number }>;
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
  paymentType?: "Monthly" | "Weekly" | "PerLesson" | "Hourly" | "Daily";
  rate?: number;
  stageRates?: Record<string, number>;
  subjectRates?: Record<string, number>;
  bankName?: string;
  iban?: string;
  accountNumber?: string;
  allowanceDetails?: Array<{ id: string; name: string; amount: number }>;
  deductionDetails?: Array<{ id: string; name: string; amount: number }>;
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
  stage?: EducationalStage;
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
  roomId?: string;
  roomName?: string;
  sectionName?: string;
  subjectName?: string;
  notes?: string;
}

export interface SavedTimetable {
  id: string;
  name: string; // e.g. "جدول الصف الأول - شعبة أ المعتمد"
  stage: EducationalStage;
  grade: string; // e.g. "الصف الأول"
  sectionId?: string; // specific section or undefined for whole grade
  sectionName?: string; // e.g. "شعبة أ" or "كافة الشُعب"
  academicYearId: string;
  termId?: string;
  termName?: string;
  status: "published" | "draft" | "archived";
  isDefault?: boolean;
  slotsCount: number;
  totalSlots: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Exam {
  id: string;
  academicYearId: string;
  name: string; // e.g., "اختبار منتصف الفصل الدراسي الأول"
  term: string; // "الفصل الأول" | "الفصل الثاني" | "الفصل الثالث" | "سنوي"
  type: "midterm" | "final" | "quiz" | "monthly" | "integrated";
  startDate: string;
  endDate: string;
  status: "draft" | "upcoming" | "ongoing" | "grading" | "completed";
  gradingSystem?: "marks" | "percentage" | "descriptive";
  weight?: number; // relative weight e.g. 20, 30, 50
  stage?: EducationalStage | "all";
}

export interface ExamSubject {
  id: string;
  examId: string;
  subjectId: string;
  date: string; // specific date for this subject's exam
  startTime?: string; // e.g. "08:00"
  duration?: number; // duration in minutes e.g. 60, 90, 120
  room?: string; // Hall/Room name e.g. "قاعة 101"
  maxScore: number;
  passScore: number;
  weight: number; // e.g., 20% of the term
  stage: EducationalStage | "all";
  grade: string; // e.g. "الصف الأول"
  sectionId?: string; // optional section restriction
  invigilator?: string; // Hall invigilator / supervisor name e.g. "أ. محمد عبد الله"
}

export interface ExamResult {
  id: string;
  examSubjectId: string;
  studentEnrollmentId: string;
  mark: number;
  descriptiveRating?: "ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "ضعيف";
  notes?: string;
  status: "draft" | "submitted" | "approved" | "published";
  approvedBy?: string;
  approvedAt?: string;
}

export interface ExamGradePolicy {
  id: string;
  examId: string; // specific exam ID or "all"
  grade: string;  // specific grade or "all"
  calculationMode: "raw" | "weighted" | "average" | "custom_scale";
  targetScale?: number; // default 100
  minPassPct: number; // default 50
  aggregationStrategy: "cumulative_sum" | "best_attempt" | "final_plus_coursework" | "drop_lowest";
  roundingMode: "1_decimal" | "round" | "ceil";
  ratingBoundaries: {
    excellent: number;
    veryGood: number;
    good: number;
    pass: number;
  };
  weightPercent?: number;
  courseworkRatio?: number;
  finalExamRatio?: number;
  customExamWeights?: Record<string, number>;
  customExamRoles?: Record<string, "coursework" | "final" | "periodic">;
  dropLowestCount?: number;
  excludedSubjectIds?: string[];
  notes?: string;
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
  markedAt?: string;
  markedBy?: string;
}

export interface StaffAdvance {
  id: string;
  staffId: string;
  staffName: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "rejected" | "paid" | "deducted";
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
  grade?: string;
  term?: string;
  copies: number;
  stage: string;
  inventoryItemId?: string;
  edition?: string;
  price?: number;
}

export interface TextbookDistribution {
  id: string;
  textbookId: string;
  studentId: string;
  date: string;
  status: "delivered" | "returned" | "damaged" | "lost" | string;
  stage: string;
  term?: string;
  academicYearId?: string;
  condition?: "جديد" | "ممتاز" | "مقبول" | "تالف" | string;
  issuedBy?: string;
  receivedByGuardian?: boolean;
  returnedDate?: string;
  notes?: string;
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
  startTime?: string; // e.g. "07:30"
  studyDays?: string[];
  periodsCount?: number;
  breaks?: { afterPeriod: number; name: string; duration?: number }[];
  preventConflicts?: boolean;
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
    kindergarten: GRADE_OPTIONS.kindergarten,
    primary: GRADE_OPTIONS.primary,
    middle: GRADE_OPTIONS.middle,
    high: GRADE_OPTIONS.high,
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
      const gradeSections = stageSections.filter(sec => sec.grade === grade);
      const matchedSec = gradeSections.length > 0 
        ? gradeSections[Math.floor(i / grades.length) % gradeSections.length] 
        : stageSections[i % stageSections.length];

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
    { id: "SUB-101", name: "الرياضيات العامة", code: "MATH101", creditHours: 5, stage: "primary", grades: ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع", "الصف الخامس", "الصف السادس"] },
    { id: "SUB-102", name: "العلوم والتكنولوجيا", code: "SCI101", creditHours: 4, stage: "primary", grades: ["الصف الرابع", "الصف الخامس", "الصف السادس"] },
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

// --- Comprehensive Enterprise Textbooks & Warehouse Generator ---
export function generateEnterpriseTextbooksAndInventory(enrollments: StudentEnrollment[]) {
  const textbooks: Textbook[] = [];
  const textbookInventoryItems: InventoryItem[] = [];
  const textbookDistributions: TextbookDistribution[] = [];

  const stageGradeConfigs: { stage: EducationalStage; grades: string[] }[] = [
    {
      stage: "primary",
      grades: ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع", "الصف الخامس", "الصف السادس"]
    },
    {
      stage: "middle",
      grades: ["الصف الأول المتوسط", "الصف الثاني المتوسط", "الصف الثالث المتوسط"]
    },
    {
      stage: "high",
      grades: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"]
    },
    {
      stage: "kindergarten",
      grades: ["روضة 1", "روضة 2"]
    }
  ];

  const terms = ["الفصل الأول", "الفصل الثاني", "الفصل الثالث"];

  stageGradeConfigs.forEach(({ stage, grades }) => {
    grades.forEach(grade => {
      let subjectDefinitions: { name: string; isAnnual?: boolean; price: number }[] = [];

      if (stage === "primary") {
        const isUpper = grade.includes("الرابع") || grade.includes("الخامس") || grade.includes("السادس");
        subjectDefinitions = [
          { name: "لغتي", price: 35 },
          { name: "الرياضيات", price: 40 },
          { name: "العلوم", price: 40 },
          { name: "الدراسات الإسلامية", price: 35 },
          { name: "اللغة الإنجليزية We Can", price: 45 },
          { name: "التربية الفنية", isAnnual: true, price: 30 },
          { name: "التربية البدنية والدفاع عن النفس", isAnnual: true, price: 25 },
          ...(isUpper ? [
            { name: "المهارات الرقمية", price: 35 },
            { name: "الدراسات الاجتماعية", price: 35 },
            { name: "المهارات الحياتية والأسرية", isAnnual: true, price: 30 },
          ] : [])
        ];
      } else if (stage === "middle") {
        subjectDefinitions = [
          { name: "لغتي الخالدة", price: 40 },
          { name: "الرياضيات", price: 45 },
          { name: "العلوم", price: 45 },
          { name: "الدراسات الإسلامية", price: 40 },
          { name: "اللغة الإنجليزية Super Goal", price: 50 },
          { name: "الدراسات الاجتماعية", price: 40 },
          { name: "المهارات الرقمية", price: 40 },
          { name: "التربية الفنية", isAnnual: true, price: 35 },
          { name: "التربية البدنية والدفاع عن النفس", isAnnual: true, price: 30 },
          ...(grade.includes("الثالث") ? [{ name: "التفكير الناقد", price: 45 }] : [])
        ];
      } else if (stage === "high") {
        subjectDefinitions = [
          { name: "الرياضيات", price: 50 },
          { name: "الفيزياء", price: 55 },
          { name: "الكيمياء", price: 55 },
          { name: "الأحياء", price: 55 },
          { name: "التقنية الرقمية", price: 45 },
          { name: "اللغة الإنجليزية Mega Goal", price: 60 },
          { name: "الكفايات اللغوية", price: 45 },
          { name: "الدراسات الإسلامية", price: 40 },
          { name: "علم البيئة", isAnnual: true, price: 50 }
        ];
      } else {
        subjectDefinitions = [
          { name: "أحرفي الهجائية الممتعة", price: 30 },
          { name: "أرقامي ورياضياتي الأولى", price: 30 },
          { name: "عالمي الصغير والاستكشاف", price: 35 },
          { name: "أخلاقي وقيمي الإسلامية", isAnnual: true, price: 25 },
          { name: "حروفي بالإنجليزية", price: 35 }
        ];
      }

      subjectDefinitions.forEach(sub => {
        const subTerms = sub.isAnnual ? ["مقرر سنوي"] : (stage === "kindergarten" ? ["الفصل الأول", "الفصل الثاني"] : terms);

        subTerms.forEach((termName, termIdx) => {
          const safeGrade = grade.replace(/\s+/g, "-");
          const safeSub = sub.name.replace(/\s+/g, "-");
          const tbId = `TB-${safeGrade}-${safeSub}-T${termIdx + 1}`;
          const invId = `ITM-BK-${safeGrade}-${safeSub}-T${termIdx + 1}`;
          const title = `كتاب ${sub.name} - ${grade} (${termName})`;
          const copiesTotal = 650;

          textbooks.push({
            id: tbId,
            title,
            subject: sub.name,
            gradeId: grade,
            term: termName,
            copies: copiesTotal,
            stage,
            inventoryItemId: invId,
            edition: "طبعة 1446 هـ المعتمدة",
            price: sub.price
          });

          textbookInventoryItems.push({
            id: invId,
            name: title,
            category: "الكتب والمقررات الدراسية",
            quantity: copiesTotal,
            price: `${sub.price} ر.س`,
            status: "available"
          });
        });
      });
    });
  });

  // Seed sample distributions for initial student enrollments
  let distSeq = 1000;
  (enrollments || []).slice(0, 160).forEach((enr, studentIdx) => {
    const studentGrade = enr.grade;
    const gradeBooks = textbooks.filter(tb => tb.gradeId === studentGrade && (tb.term === "الفصل الأول" || tb.term === "مقرر سنوي"));

    let booksToDeliver: Textbook[] = [];
    if (studentIdx % 10 < 8) {
      booksToDeliver = gradeBooks; // 80% complete
    } else if (studentIdx % 10 < 9) {
      booksToDeliver = gradeBooks.slice(0, Math.ceil(gradeBooks.length / 2)); // 10% partial
    } // 10% not received yet

    booksToDeliver.forEach(tb => {
      distSeq++;
      textbookDistributions.push({
        id: `TBD-${distSeq}`,
        textbookId: tb.id,
        studentId: enr.studentId,
        date: "2024-09-01",
        status: "delivered",
        stage: enr.stage,
        term: tb.term || "الفصل الأول",
        condition: "جديد",
        issuedBy: "أمين المستودع المركزي",
        receivedByGuardian: true
      });

      const invItem = textbookInventoryItems.find(i => i.id === tb.inventoryItemId);
      if (invItem && invItem.quantity > 0) {
        invItem.quantity -= 1;
      }
    });
  });

  return {
    textbooks,
    textbookInventoryItems,
    textbookDistributions
  };
}

const enterpriseData = generateFullEnterpriseSchoolData();
const textbookEnterpriseData = generateEnterpriseTextbooksAndInventory(enterpriseData.generatedEnrollments);

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
const initialTextbooks: Textbook[] = textbookEnterpriseData.textbooks;
const initialTextbookDistributions: TextbookDistribution[] = textbookEnterpriseData.textbookDistributions;
const initialInventoryItems: InventoryItem[] = [
  ...enterpriseData.generatedInventoryItems,
  ...textbookEnterpriseData.textbookInventoryItems
];
function generateEnterpriseExamData(
  enrollments: StudentEnrollment[],
  subjects: Subject[],
  sections: Section[],
  academicYearId: string = "Y-1002"
): {
  exams: Exam[];
  examSubjects: ExamSubject[];
  examResults: ExamResult[];
} {
  const exams: Exam[] = [
    {
      id: "EXAM-101",
      academicYearId,
      name: "اختبارات منتصف الفصل الأول 1446",
      term: "الفصل الأول",
      type: "midterm",
      startDate: "2024-10-20",
      endDate: "2024-10-31",
      status: "completed",
      gradingSystem: "marks",
      weight: 30,
      stage: "all"
    },
    {
      id: "EXAM-102",
      academicYearId,
      name: "الاختبارات الشهرية (نوفمبر) 1446",
      term: "الفصل الأول",
      type: "monthly",
      startDate: "2024-11-17",
      endDate: "2024-11-28",
      status: "completed",
      gradingSystem: "marks",
      weight: 20,
      stage: "all"
    },
    {
      id: "EXAM-103",
      academicYearId,
      name: "اختبارات نهاية الفصل الدراسي الأول 1446",
      term: "الفصل الأول",
      type: "final",
      startDate: "2024-12-22",
      endDate: "2025-01-05",
      status: "grading",
      gradingSystem: "marks",
      weight: 50,
      stage: "all"
    },
    {
      id: "EXAM-104",
      academicYearId,
      name: "التقييم الشامل والمهارات لرياض الأطفال",
      term: "الفصل الأول",
      type: "midterm",
      startDate: "2024-11-01",
      endDate: "2024-11-15",
      status: "completed",
      gradingSystem: "descriptive",
      weight: 100,
      stage: "kindergarten"
    }
  ];

  const examSubjects: ExamSubject[] = [];
  const examResults: ExamResult[] = [];

  const examTimes = ["08:00", "09:45", "11:15"];
  const rooms = ["قاعة 101", "قاعة 102", "مدرج الفاروق", "قاعة 201", "قاعة الاختبارات الكبرى"];

  let esCounter = 1;
  const stagesList: EducationalStage[] = ["primary", "middle", "high", "kindergarten"];

  for (const stg of stagesList) {
    const stageSubjects = subjects.filter(s => s.stage === stg || s.stage === "all");
    const stageSections = sections.filter(sec => sec.stage === stg);
    const uniqueGrades = Array.from(new Set(stageSections.map(sec => sec.grade)));

    const relevantExams = exams.filter(e => e.stage === "all" || e.stage === stg);

    for (const ex of relevantExams) {
      for (const gr of uniqueGrades) {
        const relevantSubjects = stageSubjects.filter(s => !s.grades || s.grades.includes(gr) || s.grades.length === 0).slice(0, 6);

        relevantSubjects.forEach((sub, subIdx) => {
          const esId = `ES-${ex.id}-${stg.substring(0, 2).toUpperCase()}-${sub.id}-${gr.replace(/\s+/g, '')}`;
          const dateOffset = (subIdx * 2);
          const baseDate = new Date(ex.startDate);
          baseDate.setDate(baseDate.getDate() + dateOffset);
          const examDate = baseDate.toISOString().split("T")[0];

          const isFinal = ex.type === "final";
          const maxScore = isFinal ? 50 : ex.type === "midterm" ? 30 : 20;
          const passScore = Math.round(maxScore * 0.5);

          const newEs: ExamSubject = {
            id: esId,
            examId: ex.id,
            subjectId: sub.id,
            date: examDate,
            startTime: examTimes[subIdx % examTimes.length],
            duration: isFinal ? 90 : 60,
            room: rooms[subIdx % rooms.length],
            maxScore,
            passScore,
            weight: ex.weight || (isFinal ? 50 : 25),
            stage: stg,
            grade: gr
          };
          examSubjects.push(newEs);

          const gradeEnrollments = enrollments.filter(e => e.stage === stg && e.grade === gr && e.status === "نشط");
          
          gradeEnrollments.forEach((enr, enrIdx) => {
            const seed = (enrIdx * 17 + subIdx * 23 + ex.name.length * 7) % 100;
            let mark = 0;
            if (seed < 8) {
              mark = Math.floor(passScore * 0.6 + (seed / 8) * (passScore * 0.35));
            } else if (seed < 25) {
              mark = Math.floor(passScore + ((seed - 8) / 17) * (maxScore * 0.25));
            } else if (seed < 70) {
              mark = Math.floor(maxScore * 0.75 + ((seed - 25) / 45) * (maxScore * 0.15));
            } else {
              mark = Math.floor(maxScore * 0.90 + ((seed - 70) / 30) * (maxScore * 0.10));
            }
            if (mark > maxScore) mark = maxScore;
            if (mark < 0) mark = 0;

            const percentage = (mark / maxScore) * 100;
            const rating: "ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "ضعيف" =
              percentage >= 90 ? "ممتاز" :
              percentage >= 80 ? "جيد جداً" :
              percentage >= 70 ? "جيد" :
              percentage >= 50 ? "مقبول" : "ضعيف";

            const isApproved = (ex.status === "completed" || enrIdx % 4 !== 0);

            examResults.push({
              id: `ER-${esCounter++}`,
              examSubjectId: esId,
              studentEnrollmentId: enr.id,
              mark,
              descriptiveRating: rating,
              status: isApproved ? "approved" : "submitted",
              approvedBy: isApproved ? "لجنة الكنترول والاختبارات" : undefined,
              approvedAt: isApproved ? ex.endDate : undefined,
              notes: mark >= maxScore * 0.95 ? "أداء استثنائي متميز" : mark < passScore ? "يحتاج تكثيف ومتابعة" : undefined
            });
          });
        });
      }
    }
  }

  return { exams, examSubjects, examResults };
}

const enterpriseExamData = generateEnterpriseExamData(
  enterpriseData.generatedEnrollments,
  enterpriseData.generatedSubjects,
  enterpriseData.generatedSections
);

const initialExams: Exam[] = enterpriseExamData.exams;
const initialExamSubjects: ExamSubject[] = enterpriseExamData.examSubjects;
const initialExamResults: ExamResult[] = enterpriseExamData.examResults;

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

const initialExpenses: Expense[] = [
  {
    id: "EXP-001",
    title: "فاتورة استهلاك الكهرباء والمياه - شهر أكتوبر",
    amount: 4500,
    date: "2023-10-15",
    categoryId: "EXPCAT-3",
    beneficiary: "هيئة الكهرباء والمياه",
    method: "bank_transfer",
    status: "posted"
  },
  {
    id: "EXP-002",
    title: "شراء قرطاسية وأوراق امتحانات وطباعة",
    amount: 1850,
    date: "2023-10-18",
    categoryId: "EXPCAT-5",
    beneficiary: "مكتبة الشرق للطباعة",
    method: "cash",
    status: "paid"
  },
  {
    id: "EXP-003",
    title: "صيانة أجهزة الحاسوب ومعمل العلوم",
    amount: 3200,
    date: "2023-10-25",
    categoryId: "EXPCAT-4",
    beneficiary: "مؤسسة الدعم التقني",
    method: "bank_transfer",
    status: "posted"
  }
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

export const enrichYearWithTerms = (year: AcademicYear): AcademicYear => {
  if (!year) return { id: "Y-default", name: "العام الحالي", startDate: "2026-08-20", endDate: "2027-06-18", isCurrent: true, terms: [] };
  if (year.terms && year.terms.length > 0) return year;
  if (!year.startDate || !year.endDate) return year;
  const start = new Date(year.startDate).getTime();
  const end = new Date(year.endDate).getTime();
  const duration = Math.max(1, end - start);
  const oneThird = duration / 3;

  const d1End = new Date(start + oneThird - 86400000 * 7);
  const d2Start = new Date(start + oneThird + 86400000 * 7);
  const d2End = new Date(start + oneThird * 2 - 86400000 * 7);
  const d3Start = new Date(start + oneThird * 2 + 86400000 * 7);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const terms: TermConfig[] = [
    {
      id: `term-${year.id}-1`,
      name: "الفصل الدراسي الأول",
      startDate: year.startDate,
      endDate: fmt(d1End),
      status: "completed",
      weightPercent: 33,
      examStartDate: fmt(new Date(d1End.getTime() - 86400000 * 8)),
      examEndDate: fmt(d1End),
    },
    {
      id: `term-${year.id}-2`,
      name: "الفصل الدراسي الثاني",
      startDate: fmt(d2Start),
      endDate: fmt(d2End),
      status: year.isCurrent ? "active" : "completed",
      weightPercent: 33,
      examStartDate: fmt(new Date(d2End.getTime() - 86400000 * 8)),
      examEndDate: fmt(d2End),
    },
    {
      id: `term-${year.id}-3`,
      name: "الفصل الدراسي الثالث",
      startDate: fmt(d3Start),
      endDate: year.endDate,
      status: year.isCurrent ? "upcoming" : "completed",
      weightPercent: 34,
      examStartDate: fmt(new Date(new Date(year.endDate).getTime() - 86400000 * 8)),
      examEndDate: year.endDate,
    },
  ];

  return {
    ...year,
    termSystem: year.termSystem || "3_terms",
    activeTermId: year.activeTermId || (year.isCurrent ? `term-${year.id}-2` : `term-${year.id}-3`),
    terms
  };
};

const initialAcademicYears: AcademicYear[] = [
  { 
    id: "Y-1000", 
    name: "1444 هـ", 
    startDate: "2024-08-20", 
    endDate: "2025-06-12", 
    isCurrent: false,
    termSystem: "3_terms",
    activeTermId: "term-1000-3",
    terms: [
      { id: "term-1000-1", name: "الفصل الدراسي الأول", startDate: "2024-08-20", endDate: "2024-11-24", status: "completed", examStartDate: "2024-11-14", examEndDate: "2024-11-24", weightPercent: 33 },
      { id: "term-1000-2", name: "الفصل الدراسي الثاني", startDate: "2024-12-04", endDate: "2025-03-02", status: "completed", examStartDate: "2025-02-20", examEndDate: "2025-03-02", weightPercent: 33 },
      { id: "term-1000-3", name: "الفصل الدراسي الثالث", startDate: "2025-03-12", endDate: "2025-06-12", status: "completed", examStartDate: "2025-06-02", examEndDate: "2025-06-12", weightPercent: 34 },
    ]
  },
  { 
    id: "Y-1001", 
    name: "1445 هـ", 
    startDate: "2025-08-24", 
    endDate: "2026-06-15", 
    isCurrent: false,
    termSystem: "3_terms",
    activeTermId: "term-1001-3",
    terms: [
      { id: "term-1001-1", name: "الفصل الدراسي الأول", startDate: "2025-08-24", endDate: "2025-11-25", status: "completed", examStartDate: "2025-11-15", examEndDate: "2025-11-25", weightPercent: 33 },
      { id: "term-1001-2", name: "الفصل الدراسي الثاني", startDate: "2025-12-05", endDate: "2026-03-01", status: "completed", examStartDate: "2026-02-20", examEndDate: "2026-03-01", weightPercent: 33 },
      { id: "term-1001-3", name: "الفصل الدراسي الثالث", startDate: "2026-03-10", endDate: "2026-06-15", status: "completed", examStartDate: "2026-06-05", examEndDate: "2026-06-15", weightPercent: 34 },
    ]
  },
  { 
    id: "Y-1002", 
    name: "العام الدراسي 1446 - 1447 هـ", 
    startDate: "2026-08-20", 
    endDate: "2027-06-18", 
    isCurrent: true,
    termSystem: "3_terms",
    activeTermId: "term-1002-2",
    terms: [
      { id: "term-1002-1", name: "الفصل الدراسي الأول", startDate: "2026-08-20", endDate: "2026-11-20", status: "completed", examStartDate: "2026-11-10", examEndDate: "2026-11-20", weightPercent: 33 },
      { id: "term-1002-2", name: "الفصل الدراسي الثاني", startDate: "2026-12-01", endDate: "2027-02-26", status: "active", examStartDate: "2027-02-16", examEndDate: "2027-02-26", weightPercent: 33 },
      { id: "term-1002-3", name: "الفصل الدراسي الثالث", startDate: "2027-03-08", endDate: "2027-06-18", status: "upcoming", examStartDate: "2027-06-08", examEndDate: "2027-06-18", weightPercent: 34 },
    ]
  },
];

function generateEnterpriseAcademicSchedules(
  sections: Section[],
  subjects: Subject[],
  staff: Staff[],
  rooms: Room[]
): {
  assignments: TeachingAssignment[];
  slots: ScheduleSlot[];
  savedTimetables: SavedTimetable[];
} {
  const assignments: TeachingAssignment[] = [];
  const slots: ScheduleSlot[] = [];
  const savedTimetables: SavedTimetable[] = [];

  const studyDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
  const periodsCount = 7;
  const stages: EducationalStage[] = ["kindergarten", "primary", "middle", "high"];

  // Filter teachers pool
  const teachers = staff.filter(s => s.role.includes("معلم") || s.role.includes("أستاذ") || s.department === "الشؤون الأكاديمية" || s.role.includes("مربية"));

  // Keep track of section and slot index
  sections.forEach((sec, secIdx) => {
    const secSubjects = subjects.filter(sub => sub.stage === "all" || sub.stage === sec.stage);
    if (secSubjects.length === 0) return;

    const subjectTeacherMap = new Map<string, string>();
    secSubjects.forEach((sub, subIdx) => {
      const teacher = teachers[(secIdx * 3 + subIdx) % teachers.length] || staff[0];
      subjectTeacherMap.set(sub.id, teacher.id);

      assignments.push({
        id: `TA-${sec.id}-${sub.id}`,
        teacherId: teacher.id,
        subjectId: sub.id,
        sectionId: sec.id,
        yearId: "Y-1002",
        stage: sec.stage
      });
    });

    let sIdx = 0;
    studyDays.forEach(day => {
      for (let p = 1; p <= periodsCount; p++) {
        const sub = secSubjects[sIdx % secSubjects.length];
        const teacherId = subjectTeacherMap.get(sub.id) || teachers[0]?.id || "EMP-1003";
        
        // Intelligent Room Routing
        let roomId = sec.roomId || rooms[sIdx % rooms.length]?.id;
        let roomName = sec.roomName || rooms[sIdx % rooms.length]?.name;
        
        const subLower = (sub.name + " " + sub.code).toLowerCase();
        if (subLower.includes("حاسب") || subLower.includes("رقمية") || subLower.includes("comp")) {
          const compLab = rooms.find(r => r.id === "RM-LAB1" || r.name.includes("حاسب"));
          if (compLab) { roomId = compLab.id; roomName = `${compLab.name} (${compLab.building})`; }
        } else if (subLower.includes("علوم") || subLower.includes("فيزياء") || subLower.includes("كيمياء") || subLower.includes("أحياء")) {
          if (p === 3 || p === 4) {
            const sciLab = rooms.find(r => r.id === "RM-LAB2" || r.name.includes("علوم"));
            if (sciLab) { roomId = sciLab.id; roomName = `${sciLab.name} (${sciLab.building})`; }
          }
        } else if (subLower.includes("بدنية") || subLower.includes("رياضة")) {
          const sportHall = rooms.find(r => r.id === "RM-HALL1" || r.name.includes("صالة") || r.name.includes("رياض"));
          if (sportHall) { roomId = sportHall.id; roomName = `${sportHall.name} (${sportHall.building})`; }
        }

        slots.push({
          id: `SCH-${sec.id}-${day}-${p}`,
          sectionId: sec.id,
          day,
          period: p,
          subjectId: sub.id,
          teacherId,
          stage: sec.stage,
          roomId,
          roomName
        });
        sIdx++;
      }
    });

    savedTimetables.push({
      id: `TT-${sec.id}`,
      name: `جدول ${sec.grade} - شعبة (${sec.name}) المعتمد`,
      stage: sec.stage,
      grade: sec.grade,
      sectionId: sec.id,
      sectionName: `شعبة ${sec.name}`,
      academicYearId: "Y-1002",
      termId: "term-1002-2",
      termName: "الفصل الدراسي الثاني",
      status: "published",
      isDefault: true,
      slotsCount: 35,
      totalSlots: 35,
      createdAt: "2026-08-20",
      updatedAt: "2026-09-01",
      notes: "الجدول الأسبوعي المعتمد للفصل الدراسي الثاني"
    });
  });

  // Grade panoramic matrix timetables
  stages.forEach(stage => {
    (GRADE_OPTIONS[stage] || []).forEach(grade => {
      const gradeSecs = sections.filter(s => s.stage === stage && s.grade === grade);
      if (gradeSecs.length > 0) {
        savedTimetables.push({
          id: `TT-GRADE-${stage}-${encodeURIComponent(grade)}`,
          name: `مصفوفة ${grade} الشاملة (جميع الشُعب)`,
          stage,
          grade,
          sectionId: undefined,
          sectionName: `كافة شُعب ${grade} (${gradeSecs.length} شُعب)`,
          academicYearId: "Y-1002",
          termId: "term-1002-2",
          termName: "الفصل الدراسي الثاني",
          status: "published",
          isDefault: false,
          slotsCount: gradeSecs.length * 35,
          totalSlots: gradeSecs.length * 35,
          createdAt: "2026-08-20",
          updatedAt: "2026-09-01",
          notes: "مصفوفة توحيد الجداول لكافة شُعب الصف"
        });
      }
    });
  });

  return { assignments, slots, savedTimetables };
}

const enterpriseSchedules = generateEnterpriseAcademicSchedules(initialSections, initialSubjects, initialStaff, initialRooms);
const initialTeachingAssignments: TeachingAssignment[] = enterpriseSchedules.assignments;
const initialScheduleSlots: ScheduleSlot[] = enterpriseSchedules.slots;
const initialSavedTimetables: SavedTimetable[] = enterpriseSchedules.savedTimetables;

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
  allExamGradePolicies: ExamGradePolicy[];
  allSubjects: Subject[];
  allScheduleSlots: ScheduleSlot[];
  allAcademicYears: AcademicYear[];
  allTeachingAssignments: TeachingAssignment[];
  allSavedTimetables: SavedTimetable[];
  
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
  activeStageSavedTimetables: SavedTimetable[];

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
  disburseStaffSalary: (payload: {
    staffId: string;
    staffName: string;
    amount: number;
    month: string;
    treasuryId: string;
    treasuryName?: string;
    method: "cash" | "bank_transfer" | "card" | "cheque";
    referenceNo: string;
    title?: string;
    notes?: string;
    settleAdvances?: boolean;
  }) => void;
  addClinicVisit: (visit: Omit<ClinicVisit, "id" | "studentName" | "stage">) => void;
  addDisciplineIncident: (incident: Omit<DisciplineIncident, "id">) => void;
  addAttendanceSession: (session: Omit<AttendanceSession, "id">, records: Omit<AttendanceRecord, "id" | "sessionId">[]) => void;
  bulkRecordStudentAttendance: (params: {
    academicYearId: string;
    sectionId: string;
    date: string;
    periodNumber?: number;
    subjectId?: string;
    supervisorName?: string;
    records: {
      studentEnrollmentId: string;
      status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
      note?: string;
    }[];
  }) => { sessionId: string; count: number };
  quickCheckInStaff: (params: {
    staffId: string;
    date: string;
    action?: "check_in" | "check_out" | "toggle";
    time?: string;
    notes?: string;
    gateSupervisor?: string;
  }) => StaffAttendanceRecord;
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
  approveExamResults: (params: {
    examSubjectId?: string;
    examId?: string;
    sectionId?: string;
    grade?: string;
    studentEnrollmentId?: string;
    status: "draft" | "submitted" | "approved" | "published";
    approvedBy?: string;
  }) => void;
  updateSingleExamResult: (
    enrollmentId: string,
    examSubjectId: string,
    markOrData: number | { mark?: number; status?: "draft" | "submitted" | "approved" | "published"; approvedBy?: string; notes?: string; descriptiveRating?: "ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "ضعيف" },
    notes?: string,
    descriptiveRating?: "ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "ضعيف"
  ) => void;
  resetExamDataToDefaults: () => void;
  getExamGradePolicy: (examId: string, grade: string) => ExamGradePolicy;
  saveExamGradePolicy: (policy: Partial<ExamGradePolicy> & { examId: string; grade: string }) => void;

  addSubject: (subject: Omit<Subject, "id">) => void;
  deleteSubject: (id: string) => void;
  updateScheduleSlot: (slot: Omit<ScheduleSlot, "id">) => void;
  clearScheduleSlot: (sectionId: string, day: string, period: number) => void;
  addAcademicYear: (year: Omit<AcademicYear, "id">) => void;
  updateAcademicYear: (id: string, updates: Partial<AcademicYear>) => void;
  addTeachingAssignment: (assignment: Omit<TeachingAssignment, "id">) => void;
  deleteTeachingAssignment: (id: string) => void;
  saveTimetable: (data: Omit<SavedTimetable, "id" | "createdAt" | "updatedAt"> & { id?: string }) => string;
  deleteSavedTimetable: (id: string) => void;
  setTimetableStatus: (id: string, status: "published" | "draft" | "archived") => void;
  cloneTimetableToSection: (sourceSectionId: string, targetSectionId: string) => void;
  batchSaveScheduleSlots: (newSlots: ScheduleSlot[]) => void;
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
  distributeBatchToSection: (sectionId: string, term?: string) => { distributedCount: number; studentCount: number };
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
  currentAcademicYear?: AcademicYear;
  activeAcademicTerm?: TermConfig;
  updateAcademicYearTerms: (yearId: string, terms: TermConfig[]) => void;
  setActiveTerm: (yearId: string, termId: string) => void;
  switchYearTermSystem: (yearId: string, system: "3_terms" | "2_terms") => void;
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
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_inventory_items") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure textbook inventory items exist if newly added
        const hasTextbooks = parsed.some((item: InventoryItem) => item.category === "كتب ومقررات دراسية");
        if (hasTextbooks) return parsed;
        return [...parsed, ...textbookEnterpriseData.textbookInventoryItems];
      }
    } catch {}
    return initialInventoryItems;
  });
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_inventory_transactions") : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialInventoryTransactions;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_inventory_items", JSON.stringify(inventoryItems));
      } catch {}
    }
  }, [inventoryItems]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_inventory_transactions", JSON.stringify(inventoryTransactions));
      } catch {}
    }
  }, [inventoryTransactions]);
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [employeeAssignments, setEmployeeAssignments] = useState<EmployeeAssignment[]>(initialEmployeeAssignments);
  const [clinicVisits, setClinicVisits] = useState<ClinicVisit[]>(initialClinicVisits);
  const [disciplineIncidents, setDisciplineIncidents] = useState<DisciplineIncident[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_attendance_sessions") : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_attendance_records") : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
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
  const [exams, setExams] = useState<Exam[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_exams") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialExams;
  });
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_exam_subjects") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialExamSubjects;
  });
  const [examResults, setExamResults] = useState<ExamResult[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_exam_results") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialExamResults;
  });
  const [examGradePolicies, setExamGradePolicies] = useState<ExamGradePolicy[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_exam_grade_policies") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
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
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_schedule_slots") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialScheduleSlots;
  });
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_academic_years") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(enrichYearWithTerms);
        }
      }
    } catch {}
    return initialAcademicYears.map(enrichYearWithTerms);
  });
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_teaching_assignments") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialTeachingAssignments;
  });
  const [savedTimetables, setSavedTimetables] = useState<SavedTimetable[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_saved_timetables") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialSavedTimetables;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_schedule_slots", JSON.stringify(scheduleSlots));
      } catch {}
    }
  }, [scheduleSlots]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_teaching_assignments", JSON.stringify(teachingAssignments));
      } catch {}
    }
  }, [teachingAssignments]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_saved_timetables", JSON.stringify(savedTimetables));
      } catch {}
    }
  }, [savedTimetables]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_exams", JSON.stringify(exams));
      } catch {}
    }
  }, [exams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_exam_subjects", JSON.stringify(examSubjects));
      } catch {}
    }
  }, [examSubjects]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_exam_results", JSON.stringify(examResults));
      } catch {}
    }
  }, [examResults]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_exam_grade_policies", JSON.stringify(examGradePolicies));
      } catch {}
    }
  }, [examGradePolicies]);

  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(initialMaintenanceRequests);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [staffEvaluations, setStaffEvaluations] = useState<StaffEvaluation[]>(initialStaffEvaluations);
  const [staffContracts, setStaffContracts] = useState<StaffContract[]>(initialStaffContracts);
  const [staffLeaves, setStaffLeaves] = useState<StaffLeave[]>(initialStaffLeaves);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendanceRecord[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_staff_attendance") : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
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
      title: "تم تسجيل 10 طلاب جدد",
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
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_system_settings", JSON.stringify(systemSettings));
      } catch (e) {
        console.error("Error persisting settings:", e);
      }
    }
  }, [systemSettings]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_currency", currency);
      } catch (e) {
        console.error("Error persisting currency:", e);
      }
    }
  }, [currency]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_academic_years", JSON.stringify(academicYears));
      } catch (e) {
        console.error("Error persisting academic years:", e);
      }
    }
  }, [academicYears]);
  
  const updateSettings = (updates: Partial<SystemSettings>) => {
    setSystemSettings(prev => ({ ...prev, ...updates }));
  };

  const [textbooks, setTextbooks] = useState<Textbook[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_textbooks") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialTextbooks;
  });

  const [textbookDistributions, setTextbookDistributions] = useState<TextbookDistribution[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_textbook_distributions") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialTextbookDistributions;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_textbooks", JSON.stringify(textbooks));
      } catch {}
    }
  }, [textbooks]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_textbook_distributions", JSON.stringify(textbookDistributions));
      } catch {}
    }
  }, [textbookDistributions]);

  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>(initialTransportRoutes);
  const [transportSubscriptions, setTransportSubscriptions] = useState<TransportSubscription[]>(initialTransportSubscriptions);

  const [timetableSettings, setTimetableSettings] = useState<TimetableSettings>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_timetable_settings") : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      maxPeriodsPerDay: 7,
      breakDuration: 25,
      periodDuration: 45,
      stage: "all",
      startTime: "07:30",
      studyDays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
      periodsCount: 7,
      breaks: [{ afterPeriod: 3, name: "الفسحة الأولى", duration: 25 }, { afterPeriod: 5, name: "الفسحة الثانية", duration: 20 }],
      preventConflicts: true,
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_timetable_settings", JSON.stringify(timetableSettings));
      } catch {}
    }
  }, [timetableSettings]);

  const currentAcademicYearId = useMemo(() => academicYears.find(y => y.isCurrent)?.id, [academicYears]);
  const currentAcademicYear = useMemo(() => academicYears.find(y => y.isCurrent) || academicYears[0], [academicYears]);
  const activeAcademicTerm = useMemo(() => {
    if (!currentAcademicYear?.terms?.length) return undefined;
    return currentAcademicYear.terms.find(t => t.status === "active" || t.id === currentAcademicYear.activeTermId) || currentAcademicYear.terms[0];
  }, [currentAcademicYear]);

  // Derived state filtered by the global active stage and active year
  const activeStageStudents = useMemo(() => {
    return studentEnrollments
      .filter(e => (!currentAcademicYearId || e.academicYearId === currentAcademicYearId) && e.stage === activeStage)
      .map(e => {
        const studentIdentity = students.find(s => s.id === e.studentId);
        return { 
          ...e, 
          ...studentIdentity, 
          id: studentIdentity?.id || e.studentId, 
          studentId: studentIdentity?.id || e.studentId,
          enrollmentId: e.id,
          sectionId: e.sectionId,
          grade: e.grade,
          stage: e.stage
        } as Student;
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
  const activeStageExams = useMemo(() => {
    if (!exams || exams.length === 0) return [];
    const stageMatched = exams.filter(ex => {
      // Kindergarten isolation
      const isKgExam = (ex.stage as string) === "kindergarten" || ex.id === "EXAM-104" || ex.name.includes("رياض الأطفال");
      if (isKgExam) {
        return (activeStage as string) === "kindergarten";
      }
      if ((activeStage as string) === "kindergarten") {
        return false;
      }
      if (ex.stage && ex.stage !== "all" && ex.stage !== activeStage) {
        return false;
      }
      return true;
    });
    const yearMatched = stageMatched.filter(ex => !ex.academicYearId || !currentAcademicYearId || ex.academicYearId === currentAcademicYearId);
    return yearMatched.length > 0 ? yearMatched : stageMatched;
  }, [exams, activeStage, currentAcademicYearId]);

  const activeStageExamSubjects = useMemo(() => {
    if (!examSubjects || examSubjects.length === 0) return initialExamSubjects;
    const stageMatched = examSubjects.filter(sub => !sub.stage || sub.stage === activeStage || sub.stage === "all");
    return stageMatched.length > 0 ? stageMatched : examSubjects;
  }, [examSubjects, activeStage]);
  const activeStageSubjects = useMemo(() => subjects.filter(sub => sub.stage === activeStage || sub.stage === "all"), [subjects, activeStage]);
  const activeStageScheduleSlots = useMemo(() => scheduleSlots.filter(s => s.stage === activeStage), [scheduleSlots, activeStage]);
  const activeStageTeachingAssignments = useMemo(() => teachingAssignments.filter(ta => ta.stage === activeStage), [teachingAssignments, activeStage]);
  const activeStageSavedTimetables = useMemo(() => savedTimetables.filter(t => t.stage === activeStage), [savedTimetables, activeStage]);



  const activeStageTextbooks = useMemo(() => (activeStage as string) === "all" ? textbooks : textbooks.filter(t => !t.stage || t.stage === activeStage), [textbooks, activeStage]);
  const activeStageDistributions = useMemo(() => (activeStage as string) === "all" ? textbookDistributions : textbookDistributions.filter(d => !d.stage || d.stage === activeStage), [textbookDistributions, activeStage]);
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
    const targetStudentId = id.startsWith("ENR-")
      ? (studentEnrollments.find(e => e.id === id)?.studentId || id)
      : id;
    setStudents(prev => prev.map(s => (s.id === targetStudentId || s.id === id) ? { ...s, ...updates } : s));
    setStudentEnrollments(prev => prev.map(e => ((e.studentId === targetStudentId || e.id === id) && e.academicYearId === currentAcademicYearId) ? { ...e, ...updates } as StudentEnrollment : e));
  };

  const softDeleteStudent = (id: string) => {
    const targetStudentId = id.startsWith("ENR-")
      ? (studentEnrollments.find(e => e.id === id)?.studentId || id)
      : id;
    setStudents(prev => prev.map(s => (s.id === targetStudentId || s.id === id) ? { ...s, isDeleted: true, deletedAt: new Date().toISOString() } : s));
  };

  const restoreStudent = (id: string) => {
    const targetStudentId = id.startsWith("ENR-")
      ? (studentEnrollments.find(e => e.id === id)?.studentId || id)
      : id;
    setStudents(prev => prev.map(s => (s.id === targetStudentId || s.id === id) ? { ...s, isDeleted: false, deletedAt: undefined } : s));
  };

  const hardDeleteStudent = (id: string) => {
    const targetStudentId = id.startsWith("ENR-")
      ? (studentEnrollments.find(e => e.id === id)?.studentId || id)
      : id;
    setStudents(prev => prev.filter(s => s.id !== targetStudentId && s.id !== id));
    setStudentEnrollments(prev => prev.filter(e => e.studentId !== targetStudentId && e.id !== id));
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

  const disburseStaffSalary = (payload: {
    staffId: string;
    staffName: string;
    amount: number;
    month: string;
    treasuryId: string;
    treasuryName?: string;
    method: "cash" | "bank_transfer" | "card" | "cheque";
    referenceNo: string;
    title?: string;
    notes?: string;
    settleAdvances?: boolean;
  }) => {
    addExpense({
      title: payload.title || `صرف مستحقات وراتب شهر ${payload.month} - ${payload.staffName}`,
      amount: payload.amount,
      date: new Date().toISOString().split("T")[0],
      categoryId: "EXPCAT-1", // رواتب ومستحقات الكادر
      beneficiary: payload.staffName,
      method: payload.method === "card" ? "bank_transfer" : payload.method,
      referenceNo: payload.referenceNo,
      notes: payload.notes || `صرف مستحقات معتمدة من الخزينة/بنكك (${payload.treasuryName || "الخزينة المدرسية"})`,
      status: "posted",
      sessionId: payload.treasuryId,
    });

    if (payload.settleAdvances) {
      setStaffAdvances(prev => prev.map(a => {
        const match = a.staffId === payload.staffId || a.staffName === payload.staffName;
        if (match && a.status === "paid" && (a.deductionMonth === payload.month || (a.deductionMonth && a.deductionMonth <= payload.month))) {
          return { ...a, status: "deducted" as const };
        }
        return a;
      }));
    }
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

  // Sync attendance state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("darasi_attendance_sessions", JSON.stringify(attendanceSessions));
    } catch {}
  }, [attendanceSessions]);

  useEffect(() => {
    try {
      localStorage.setItem("darasi_attendance_records", JSON.stringify(attendanceRecords));
    } catch {}
  }, [attendanceRecords]);

  useEffect(() => {
    try {
      localStorage.setItem("darasi_staff_attendance", JSON.stringify(staffAttendance));
    } catch {}
  }, [staffAttendance]);

  const bulkRecordStudentAttendance = (params: {
    academicYearId: string;
    sectionId: string;
    date: string;
    periodNumber?: number;
    subjectId?: string;
    supervisorName?: string;
    records: {
      studentEnrollmentId: string;
      status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
      note?: string;
    }[];
  }) => {
    const period = params.periodNumber || 1;
    const now = new Date().toISOString();
    const markedBy = params.supervisorName || "مشرف الدور / الفصل";

    const existing = attendanceSessions.find(
      s => s.academicYearId === params.academicYearId &&
           s.sectionId === params.sectionId &&
           s.date === params.date &&
           s.periodNumber === period
    );

    const sessionId = existing ? existing.id : `AS-${Math.floor(1000 + Math.random() * 9000)}`;

    if (existing) {
      setAttendanceSessions(prev => prev.map(s => s.id === sessionId ? {
        ...s,
        status: "closed",
        createdBy: markedBy,
      } : s));

      setAttendanceRecords(prev => {
        const remaining = prev.filter(r => r.sessionId !== sessionId);
        const newRecords: AttendanceRecord[] = params.records.map(r => ({
          id: `AR-${Math.floor(10000 + Math.random() * 90000)}`,
          sessionId,
          studentEnrollmentId: r.studentEnrollmentId,
          status: r.status,
          note: r.note,
          markedBy,
          markedAt: now,
        }));
        return [...newRecords, ...remaining];
      });
    } else {
      const newSession: AttendanceSession = {
        id: sessionId,
        academicYearId: params.academicYearId,
        sectionId: params.sectionId,
        subjectId: params.subjectId || "general_attendance",
        teacherId: markedBy,
        periodNumber: period,
        date: params.date,
        status: "closed",
        createdBy: markedBy,
        createdAt: now,
      };

      const newRecords: AttendanceRecord[] = params.records.map(r => ({
        id: `AR-${Math.floor(10000 + Math.random() * 90000)}`,
        sessionId,
        studentEnrollmentId: r.studentEnrollmentId,
        status: r.status,
        note: r.note,
        markedBy,
        markedAt: now,
      }));

      setAttendanceSessions(prev => [newSession, ...prev]);
      setAttendanceRecords(prev => [...newRecords, ...prev]);
    }

    // Auto add discipline incidents for absent students
    params.records.forEach(r => {
      if (r.status === "ABSENT") {
        setDisciplineIncidents(prev => {
          const alreadyLogged = prev.some(di => di.studentEnrollmentId === r.studentEnrollmentId && di.date === params.date);
          if (alreadyLogged) return prev;
          return [{
            id: `DI-${Math.floor(1000 + Math.random() * 9000)}`,
            studentEnrollmentId: r.studentEnrollmentId,
            date: params.date,
            description: `غياب مرصود عبر تطبيق المشرفين (الفصل / الحصة ${period})`,
            responsiblePerson: markedBy,
            actionTaken: "إنذار غياب ورصد تلقائي"
          }, ...prev];
        });
      }
    });

    return { sessionId, count: params.records.length };
  };

  const quickCheckInStaff = (params: {
    staffId: string;
    date: string;
    action?: "check_in" | "check_out" | "toggle";
    time?: string;
    notes?: string;
    gateSupervisor?: string;
  }): StaffAttendanceRecord => {
    const action = params.action || "toggle";
    const curTime = params.time || new Date().toTimeString().slice(0, 8);
    const markedBy = params.gateSupervisor || "مشرف البوابة العامة";

    let resultRecord: StaffAttendanceRecord = {
      id: `STA-${Math.floor(10000 + Math.random() * 90000)}`,
      staffId: params.staffId,
      date: params.date,
      status: "present"
    };

    setStaffAttendance(prev => {
      const idx = prev.findIndex(r => r.staffId === params.staffId && r.date === params.date);
      const existing = idx >= 0 ? prev[idx] : null;

      let effectiveAction = action;
      if (effectiveAction === "toggle") {
        if (!existing || !existing.checkIn) {
          effectiveAction = "check_in";
        } else if (!existing.checkOut) {
          effectiveAction = "check_out";
        } else {
          effectiveAction = "check_out";
        }
      }

      if (effectiveAction === "check_in") {
        let minutesLate = 0;
        let status: StaffAttendanceRecord["status"] = "present";
        try {
          const [hh, mm] = curTime.split(":").map(Number);
          const arrivalMinutes = (hh || 0) * 60 + (mm || 0);
          const shiftStartMinutes = 7 * 60 + 15; // 07:15 AM
          if (arrivalMinutes > shiftStartMinutes) {
            minutesLate = arrivalMinutes - shiftStartMinutes;
            status = "late";
          }
        } catch {}

        resultRecord = {
          id: existing?.id || `STA-${Math.floor(10000 + Math.random() * 90000)}`,
          staffId: params.staffId,
          date: params.date,
          checkIn: curTime,
          checkOut: existing?.checkOut,
          status,
          minutesLate,
          notes: params.notes || (minutesLate > 0 ? `تأخر صباحي ${minutesLate} دقيقة - بوابة الاستقبال` : `تسجيل دخول عبر بوابة الاستقبال (${markedBy})`)
        };
      } else {
        resultRecord = {
          id: existing?.id || `STA-${Math.floor(10000 + Math.random() * 90000)}`,
          staffId: params.staffId,
          date: params.date,
          checkIn: existing?.checkIn || curTime,
          checkOut: curTime,
          status: existing?.status || "present",
          minutesLate: existing?.minutesLate || 0,
          notes: params.notes || (existing?.notes ? `${existing.notes} | انصراف ${curTime}` : `انصراف عبر البوابة (${markedBy})`)
        };
      }

      const next = [...prev];
      if (idx >= 0) {
        next[idx] = resultRecord;
      } else {
        next.unshift(resultRecord);
      }
      return next;
    });

    const staffMember = staff.find(s => s.id === params.staffId);
    const workerName = staffMember ? staffMember.name : params.staffId;
    const logAction = action === "check_out" ? "تسجيل انصراف" : "تسجيل دخول";
    
    setActivityLogs(prev => [{
      id: `AL-${Math.floor(1000 + Math.random() * 9000)}`,
      user: markedBy,
      action: logAction,
      entity: "بوابة الحضور",
      details: `${logAction}: ${workerName} الساعة ${curTime}`,
      date: new Date().toISOString()
    }, ...prev]);

    return resultRecord;
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
          updated[existingIdx] = { ...updated[existingIdx], mark: r.mark, notes: r.notes, status: r.status, descriptiveRating: r.descriptiveRating || updated[existingIdx].descriptiveRating };
        } else {
          updated.push({ ...r, id: `ER-${Math.floor(1000 + Math.random() * 9000)}` });
        }
      }
      return updated;
    });
  };

  const approveExamResults = ({
    examSubjectId,
    examId,
    sectionId,
    grade,
    studentEnrollmentId,
    status,
    approvedBy = "لجنة الاختبارات والكنترول"
  }: {
    examSubjectId?: string;
    examId?: string;
    sectionId?: string;
    grade?: string;
    studentEnrollmentId?: string;
    status: "draft" | "submitted" | "approved" | "published";
    approvedBy?: string;
  }) => {
    const approvedAt = new Date().toISOString().split("T")[0];
    setExamResults(prev => {
      let targetEnrollmentIds: Set<string> | null = null;
      if (sectionId || grade) {
        targetEnrollmentIds = new Set(
          studentEnrollments
            .filter(e => (!sectionId || e.sectionId === sectionId) && (!grade || e.grade === grade))
            .map(e => e.id)
        );
      }

      let targetExamSubjectIds: Set<string> | null = null;
      if (examId) {
        targetExamSubjectIds = new Set(
          examSubjects.filter(es => es.examId === examId).map(es => es.id)
        );
      }

      return prev.map(r => {
        if (examSubjectId && r.examSubjectId !== examSubjectId) return r;
        if (studentEnrollmentId && r.studentEnrollmentId !== studentEnrollmentId) return r;
        if (targetExamSubjectIds && !targetExamSubjectIds.has(r.examSubjectId)) return r;
        if (targetEnrollmentIds && !targetEnrollmentIds.has(r.studentEnrollmentId)) return r;

        return {
          ...r,
          status,
          approvedBy: status === "approved" || status === "published" ? approvedBy : undefined,
          approvedAt: status === "approved" || status === "published" ? approvedAt : undefined,
        };
      });
    });
  };

  const updateSingleExamResult = (
    enrollmentId: string,
    examSubjectId: string,
    markOrData: number | { mark?: number; status?: "draft" | "submitted" | "approved" | "published"; approvedBy?: string; notes?: string; descriptiveRating?: "ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "ضعيف" },
    notes?: string,
    descriptiveRating?: "ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "ضعيف"
  ) => {
    setExamResults(prev => {
      const idx = prev.findIndex(r => 
        (r.studentEnrollmentId === enrollmentId && r.examSubjectId === examSubjectId) ||
        (r.studentEnrollmentId === examSubjectId && r.examSubjectId === enrollmentId)
      );

      const markVal = typeof markOrData === "number" ? markOrData : (markOrData?.mark ?? 0);
      const statusVal = typeof markOrData === "object" && markOrData.status ? markOrData.status : undefined;
      const approvedByVal = typeof markOrData === "object" && markOrData.approvedBy ? markOrData.approvedBy : undefined;
      const notesVal = typeof markOrData === "object" && markOrData.notes !== undefined ? markOrData.notes : notes;
      const descVal = typeof markOrData === "object" && markOrData.descriptiveRating ? markOrData.descriptiveRating : descriptiveRating;

      if (idx >= 0) {
        const updated = [...prev];
        const current = updated[idx];
        updated[idx] = {
          ...current,
          mark: typeof markOrData === "number" ? markOrData : (markOrData?.mark !== undefined ? markOrData.mark : current.mark),
          status: statusVal || current.status,
          approvedBy: approvedByVal !== undefined ? approvedByVal : current.approvedBy,
          notes: notesVal !== undefined ? notesVal : current.notes,
          descriptiveRating: descVal || current.descriptiveRating,
        };
        return updated;
      } else {
        const actualEnrollmentId = prev.some(r => r.studentEnrollmentId === enrollmentId) ? enrollmentId :
          prev.some(r => r.studentEnrollmentId === examSubjectId) ? examSubjectId : enrollmentId;
        const actualSubjectId = actualEnrollmentId === enrollmentId ? examSubjectId : enrollmentId;

        return [
          ...prev,
          {
            id: `ER-${Math.floor(1000 + Math.random() * 9000)}`,
            examSubjectId: actualSubjectId,
            studentEnrollmentId: actualEnrollmentId,
            mark: markVal,
            notes: notesVal,
            descriptiveRating: descVal,
            status: statusVal || "submitted",
            approvedBy: approvedByVal,
          }
        ];
      }
    });
  };

  const resetExamDataToDefaults = () => {
    const freshData = generateEnterpriseExamData(
      studentEnrollments,
      subjects,
      sections
    );
    setExams(freshData.exams);
    setExamSubjects(freshData.examSubjects);
    setExamResults(freshData.examResults);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("darasi_exams", JSON.stringify(freshData.exams));
        localStorage.setItem("darasi_exam_subjects", JSON.stringify(freshData.examSubjects));
        localStorage.setItem("darasi_exam_results", JSON.stringify(freshData.examResults));
      } catch {}
    }
  };

  const normalizeGradeForPolicy = (g: string = "") => g.replace(/الابتدائي|المتوسط|الثانوي/g, "").replace(/\s+/g, " ").trim();

  const getExamGradePolicy = (examId: string, grade: string): ExamGradePolicy => {
    const normGrade = normalizeGradeForPolicy(grade);
    const found = examGradePolicies.find(p => 
      (p.examId === examId || p.examId === "all") && 
      (normalizeGradeForPolicy(p.grade) === normGrade || p.grade === "all" || !p.grade)
    ) || examGradePolicies.find(p => p.examId === examId) || examGradePolicies.find(p => p.examId === "all");

    if (found) return found;

    return {
      id: `POL-${examId}-${normGrade || "default"}`,
      examId,
      grade,
      calculationMode: "raw", // Raw normal marks by default
      targetScale: 100,
      minPassPct: 50,
      aggregationStrategy: "cumulative_sum",
      roundingMode: "round",
      ratingBoundaries: {
        excellent: 90,
        veryGood: 80,
        good: 65,
        pass: 50,
      },
      weightPercent: 100,
      courseworkRatio: 40,
      finalExamRatio: 60,
      excludedSubjectIds: [],
    };
  };

  const saveExamGradePolicy = (policy: Partial<ExamGradePolicy> & { examId: string; grade: string }) => {
    setExamGradePolicies(prev => {
      const normGrade = normalizeGradeForPolicy(policy.grade);
      const idx = prev.findIndex(p => p.examId === policy.examId && normalizeGradeForPolicy(p.grade) === normGrade);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...policy };
        return updated;
      } else {
        const newPolicy: ExamGradePolicy = {
          id: `POL-${policy.examId}-${normGrade || Date.now()}`,
          examId: policy.examId,
          grade: policy.grade,
          calculationMode: policy.calculationMode || "raw",
          targetScale: policy.targetScale ?? 100,
          minPassPct: policy.minPassPct ?? 50,
          aggregationStrategy: policy.aggregationStrategy || "cumulative_sum",
          roundingMode: policy.roundingMode || "round",
          ratingBoundaries: policy.ratingBoundaries || { excellent: 90, veryGood: 80, good: 65, pass: 50 },
          weightPercent: policy.weightPercent ?? 100,
          courseworkRatio: policy.courseworkRatio ?? 40,
          finalExamRatio: policy.finalExamRatio ?? 60,
          customExamWeights: policy.customExamWeights,
          customExamRoles: policy.customExamRoles,
          dropLowestCount: policy.dropLowestCount ?? 1,
          excludedSubjectIds: policy.excludedSubjectIds || [],
          notes: policy.notes,
        };
        return [...prev, newPolicy];
      }
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

  const saveTimetable = (data: Omit<SavedTimetable, "id" | "createdAt" | "updatedAt"> & { id?: string }): string => {
    const now = new Date().toISOString().split("T")[0];
    const targetId = data.id || `TT-${data.sectionId || data.grade.replace(/\s+/g, '_')}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    setSavedTimetables(prev => {
      const existingIdx = prev.findIndex(t => t.id === targetId || (data.sectionId && t.sectionId === data.sectionId && t.termId === data.termId));
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...data,
          id: updated[existingIdx].id,
          updatedAt: now
        };
        return updated;
      } else {
        const newRecord: SavedTimetable = {
          ...data,
          id: targetId,
          createdAt: now,
          updatedAt: now
        };
        return [newRecord, ...prev];
      }
    });

    return targetId;
  };

  const deleteSavedTimetable = (id: string) => {
    setSavedTimetables(prev => prev.filter(t => t.id !== id));
  };

  const setTimetableStatus = (id: string, status: "published" | "draft" | "archived") => {
    setSavedTimetables(prev => prev.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString().split("T")[0] } : t));
  };

  const cloneTimetableToSection = (sourceSectionId: string, targetSectionId: string) => {
    const sourceSlots = scheduleSlots.filter(s => s.sectionId === sourceSectionId);
    if (sourceSlots.length === 0) return;

    const targetSec = sections.find(s => s.id === targetSectionId);
    if (!targetSec) return;

    const otherSlots = scheduleSlots.filter(s => s.sectionId !== targetSectionId);
    const newSlots: ScheduleSlot[] = sourceSlots.map(s => ({
      ...s,
      id: `SCH-${targetSectionId}-${s.day}-${s.period}`,
      sectionId: targetSectionId,
      stage: targetSec.stage,
      roomId: targetSec.roomId || s.roomId,
      roomName: targetSec.roomName || s.roomName
    }));

    setScheduleSlots([...otherSlots, ...newSlots]);

    const now = new Date().toISOString().split("T")[0];
    setSavedTimetables(prev => {
      const existingIdx = prev.findIndex(t => t.sectionId === targetSectionId);
      const ttData: SavedTimetable = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `TT-${targetSectionId}`,
        name: `جدول ${targetSec.grade} - شعبة (${targetSec.name}) المعتمد`,
        stage: targetSec.stage,
        grade: targetSec.grade,
        sectionId: targetSectionId,
        sectionName: `شعبة ${targetSec.name}`,
        academicYearId: currentAcademicYearId || "Y-1002",
        termId: activeAcademicTerm?.id || "term-1002-2",
        termName: activeAcademicTerm?.name || "الفصل الدراسي الثاني",
        status: "published",
        isDefault: true,
        slotsCount: newSlots.length,
        totalSlots: 35,
        createdAt: now,
        updatedAt: now,
        notes: `تم نسخه وتعميمه من جدول ${sourceSectionId}`
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = ttData;
        return copy;
      }
      return [ttData, ...prev];
    });
  };

  const batchSaveScheduleSlots = (newSlots: ScheduleSlot[]) => {
    setScheduleSlots(prev => {
      const filtered = prev.filter(s => !newSlots.some(ns => ns.sectionId === s.sectionId && ns.day === s.day && ns.period === s.period));
      return [...filtered, ...newSlots];
    });
  };

  const addAcademicYear = (yearData: Omit<AcademicYear, "id">) => {
    setAcademicYears(prev => {
      let newState = [...prev];
      if (yearData.isCurrent) {
        newState = newState.map(y => ({ ...y, isCurrent: false }));
      }
      const newYearRaw: AcademicYear = { ...yearData, id: `Y-${Math.floor(1000 + Math.random() * 9000)}` };
      newState.push(enrichYearWithTerms(newYearRaw));
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

  const updateAcademicYearTerms = (yearId: string, terms: TermConfig[]) => {
    setAcademicYears(prev => prev.map(y => {
      if (y.id === yearId) {
        const activeTerm = terms.find(t => t.status === "active") || terms[0];
        return { ...y, terms, activeTermId: activeTerm?.id || y.activeTermId };
      }
      return y;
    }));
  };

  const setActiveTerm = (yearId: string, termId: string) => {
    setAcademicYears(prev => prev.map(y => {
      if (y.id === yearId) {
        const targetIdx = (y.terms || []).findIndex(t => t.id === termId);
        const updatedTerms = (y.terms || []).map((t, idx) => {
          if (t.id === termId) {
            return { ...t, status: "active" as const };
          }
          if (targetIdx !== -1) {
            return { ...t, status: idx < targetIdx ? ("completed" as const) : ("upcoming" as const) };
          }
          return { ...t, status: "upcoming" as const };
        });
        return { ...y, activeTermId: termId, terms: updatedTerms };
      }
      return y;
    }));
  };

  const switchYearTermSystem = (yearId: string, system: "3_terms" | "2_terms") => {
    setAcademicYears(prev => prev.map(y => {
      if (y.id === yearId) {
        const start = new Date(y.startDate).getTime();
        const end = new Date(y.endDate).getTime();
        const duration = Math.max(1, end - start);
        const fmt = (d: Date) => d.toISOString().split("T")[0];

        let newTerms: TermConfig[] = [];
        if (system === "2_terms") {
          const mid = start + duration / 2;
          const t1End = new Date(mid - 86400000 * 10);
          const t2Start = new Date(mid + 86400000 * 4);
          newTerms = [
            { 
              id: `term-${y.id}-1`, 
              name: "الفصل الدراسي الأول", 
              startDate: y.startDate, 
              endDate: fmt(t1End), 
              status: "completed", 
              weightPercent: 50,
              examStartDate: fmt(new Date(t1End.getTime() - 86400000 * 10)),
              examEndDate: fmt(t1End),
            },
            { 
              id: `term-${y.id}-2`, 
              name: "الفصل الدراسي الثاني", 
              startDate: fmt(t2Start), 
              endDate: y.endDate, 
              status: y.isCurrent ? "active" : "completed", 
              weightPercent: 50,
              examStartDate: fmt(new Date(new Date(y.endDate).getTime() - 86400000 * 10)),
              examEndDate: y.endDate,
            },
          ];
        } else {
          const oneThird = duration / 3;
          const t1End = new Date(start + oneThird - 86400000 * 7);
          const t2Start = new Date(start + oneThird + 86400000 * 7);
          const t2End = new Date(start + oneThird * 2 - 86400000 * 7);
          const t3Start = new Date(start + oneThird * 2 + 86400000 * 7);
          newTerms = [
            { 
              id: `term-${y.id}-1`, 
              name: "الفصل الدراسي الأول", 
              startDate: y.startDate, 
              endDate: fmt(t1End), 
              status: "completed", 
              weightPercent: 33,
              examStartDate: fmt(new Date(t1End.getTime() - 86400000 * 8)),
              examEndDate: fmt(t1End),
            },
            { 
              id: `term-${y.id}-2`, 
              name: "الفصل الدراسي الثاني", 
              startDate: fmt(t2Start), 
              endDate: fmt(t2End), 
              status: y.isCurrent ? "active" : "completed", 
              weightPercent: 33,
              examStartDate: fmt(new Date(t2End.getTime() - 86400000 * 8)),
              examEndDate: fmt(t2End),
            },
            { 
              id: `term-${y.id}-3`, 
              name: "الفصل الدراسي الثالث", 
              startDate: fmt(t3Start), 
              endDate: y.endDate, 
              status: y.isCurrent ? "upcoming" : "completed", 
              weightPercent: 34,
              examStartDate: fmt(new Date(new Date(y.endDate).getTime() - 86400000 * 8)),
              examEndDate: y.endDate,
            },
          ];
        }

        const activeTerm = newTerms.find(t => t.status === "active") || newTerms[0];
        return {
          ...y,
          termSystem: system,
          terms: newTerms,
          activeTermId: activeTerm.id
        };
      }
      return y;
    }));
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
    const newId = `TBD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDist: TextbookDistribution = {
      id: newId,
      condition: "جديد",
      issuedBy: "أمين المستودع المدرسي",
      receivedByGuardian: true,
      ...distribution,
      date: new Date().toISOString().split('T')[0],
      status: "delivered",
    };
    setTextbookDistributions(prev => [newDist, ...prev]);

    // Warehouse inventory stock sync
    const tb = textbooks.find(t => t.id === distribution.textbookId);
    if (tb) {
      const invItem = inventoryItems.find(i => (tb.inventoryItemId && i.id === tb.inventoryItemId) || i.name.includes(tb.title));
      if (invItem) {
        setInventoryItems(prev => prev.map(i => {
          if (i.id === invItem.id) {
            const newQty = Math.max(0, i.quantity - 1);
            return {
              ...i,
              quantity: newQty,
              status: newQty === 0 ? "out_of_stock" : newQty <= 10 ? "low_stock" : "available"
            };
          }
          return i;
        }));

        const student = students.find(s => s.id === distribution.studentId);
        const newTxn: InventoryTransaction = {
          id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
          itemId: invItem.id,
          itemName: invItem.name,
          type: "issue",
          quantity: 1,
          date: new Date().toISOString().split("T")[0],
          by: "أمين المستودع المدرسي",
          to: student ? student.name : "طالب",
        };
        setInventoryTransactions(prev => [newTxn, ...prev]);
      }
    }
  };

  const removeDistribution = (id: string) => {
    const dist = textbookDistributions.find(d => d.id === id);
    if (dist) {
      const tb = textbooks.find(t => t.id === dist.textbookId);
      if (tb) {
        const invItem = inventoryItems.find(i => (tb.inventoryItemId && i.id === tb.inventoryItemId) || i.name.includes(tb.title));
        if (invItem) {
          setInventoryItems(prev => prev.map(i => {
            if (i.id === invItem.id) {
              const newQty = i.quantity + 1;
              return {
                ...i,
                quantity: newQty,
                status: newQty <= 10 ? "low_stock" : "available"
              };
            }
            return i;
          }));

          const student = students.find(s => s.id === dist.studentId);
          const newTxn: InventoryTransaction = {
            id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
            itemId: invItem.id,
            itemName: invItem.name,
            type: "receive",
            quantity: 1,
            date: new Date().toISOString().split("T")[0],
            by: student ? student.name : "طالب",
            to: "المستودع المدرسي",
          };
          setInventoryTransactions(prev => [newTxn, ...prev]);
        }
      }
    }
    setTextbookDistributions(prev => prev.filter(d => d.id !== id));
  };

  const distributeBatchToSection = (sectionId: string, term?: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return { distributedCount: 0, studentCount: 0 };

    const enrolledIds = studentEnrollments
      .filter(e => e.sectionId === sectionId)
      .map(e => e.studentId);

    const targetStudents = enrolledIds.length > 0
      ? students.filter(s => enrolledIds.includes(s.id))
      : students.filter(s => s.grade === section.grade);

    const targetTextbooks = textbooks.filter(tb => {
      const gradeMatches = tb.gradeId === section.grade || tb.grade === section.grade || (tb as any).gradeId === section.name;
      const termMatches = term ? (!tb.term || tb.term === term || tb.term === "all" || tb.term === "الفصل الأول") : true;
      return gradeMatches && termMatches;
    });

    if (targetStudents.length === 0 || targetTextbooks.length === 0) {
      return { distributedCount: 0, studentCount: targetStudents.length };
    }

    const newDistributions: TextbookDistribution[] = [];
    const itemDecrements: Record<string, { invItem: InventoryItem; count: number }> = {};

    targetStudents.forEach(st => {
      targetTextbooks.forEach(tb => {
        const alreadyHas = textbookDistributions.some(
          d => d.studentId === st.id && d.textbookId === tb.id
        ) || newDistributions.some(
          d => d.studentId === st.id && d.textbookId === tb.id
        );

        if (!alreadyHas) {
          newDistributions.push({
            id: `TBD-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(Math.random() * 1000)}`,
            textbookId: tb.id,
            studentId: st.id,
            date: new Date().toISOString().split('T')[0],
            status: "delivered",
            stage: tb.stage,
            term: tb.term || term || "الفصل الأول",
            academicYearId: currentAcademicYearId || "",
            condition: "جديد",
            issuedBy: "أمين المستودع المدرسي",
            receivedByGuardian: true,
          });

          const invItem = inventoryItems.find(i => (tb.inventoryItemId && i.id === tb.inventoryItemId) || i.name.includes(tb.title));
          if (invItem) {
            if (!itemDecrements[invItem.id]) {
              itemDecrements[invItem.id] = { invItem, count: 0 };
            }
            itemDecrements[invItem.id].count += 1;
          }
        }
      });
    });

    if (newDistributions.length > 0) {
      setTextbookDistributions(prev => [...newDistributions, ...prev]);

      setInventoryItems(prev => prev.map(i => {
        if (itemDecrements[i.id]) {
          const dec = itemDecrements[i.id].count;
          const newQty = Math.max(0, i.quantity - dec);
          return {
            ...i,
            quantity: newQty,
            status: newQty === 0 ? "out_of_stock" : newQty <= 10 ? "low_stock" : "available"
          };
        }
        return i;
      }));

      const newTxns: InventoryTransaction[] = Object.values(itemDecrements).map(dec => ({
        id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
        itemId: dec.invItem.id,
        itemName: dec.invItem.name,
        type: "issue",
        quantity: dec.count,
        date: new Date().toISOString().split("T")[0],
        by: "أمين المستودع المدرسي",
        to: `شعبة ${section.name} (${section.grade})`,
      }));
      setInventoryTransactions(prev => [...newTxns, ...prev]);
    }

    return { distributedCount: newDistributions.length, studentCount: targetStudents.length };
  };

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
      allExams: exams, allExamSubjects: examSubjects, allExamResults: examResults, allExamGradePolicies: examGradePolicies, allSubjects: subjects,
      allScheduleSlots: scheduleSlots, allAcademicYears: academicYears, allTeachingAssignments: teachingAssignments,
      allSavedTimetables: savedTimetables,
      activeStageSavedTimetables,
      saveTimetable, deleteSavedTimetable, cloneTimetableToSection, setTimetableStatus, batchSaveScheduleSlots,
      
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
      distributeBatchToSection,
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
      processInventoryTransaction, addStaff, updateStaff, deleteStaff: hardDeleteStaff, upsertStaffAttendance, quickCheckInStaff, addStaffAdvance, disburseStaffSalary, addClinicVisit, addDisciplineIncident, addAttendanceSession, bulkRecordStudentAttendance, addBehaviorTransaction,
      addSection, updateSection, deleteSection, 

      currency,
      setCurrency,
      addExam, updateExam, deleteExam, addExamSubject, updateExamSubject, deleteExamSubject, saveExamResults, approveExamResults, updateSingleExamResult, resetExamDataToDefaults, getExamGradePolicy, saveExamGradePolicy, addSubject, deleteSubject,
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
      currentAcademicYearId,
      currentAcademicYear,
      activeAcademicTerm,
      updateAcademicYearTerms,
      setActiveTerm,
      switchYearTermSystem
    }}>
      {children}
    </GlobalStoreContext.Provider>
  );
}

export function useGlobalStore() {
  const context = useContext(GlobalStoreContext);
  if (context === undefined) {
    return {} as Partial<GlobalStoreContextType> as GlobalStoreContextType;
  }
  return context;
}
