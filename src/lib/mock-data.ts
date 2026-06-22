/* =========================================================
   Mock Data — School Management System
   Centralized so all pages share the same domain entities.
   ========================================================= */

export type ID = string;

export type Gender = "male" | "female";
export type StudentStatus = "active" | "transferred" | "graduated" | "suspended";

export interface Student {
  id: ID;
  admissionNo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  gradeId: ID;
  sectionId: ID;
  status: StudentStatus;
  admissionDate: string;
  guardianId: ID;
  attendanceRate: number; // 0..100
}

export interface Guardian {
  id: ID;
  name: string;
  phone: string;
  email: string;
  occupation: string;
  address: string;
  relation: "أب" | "أم" | "ولي";
}

export interface Teacher {
  id: ID;
  employeeNo: string;
  name: string;
  phone: string;
  email: string;
  subjects: ID[];
  sections: ID[];
  status: "active" | "leave" | "inactive";
}

export interface Grade {
  id: ID;
  name: string;
  order: number;
}
export interface Section {
  id: ID;
  name: string;
  gradeId: ID;
  capacity: number;
}
export interface Subject {
  id: ID;
  name: string;
  code: string;
  creditHours: number;
}
export interface AcademicYear {
  id: ID;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
export interface Term {
  id: ID;
  name: string;
  yearId: ID;
}
export interface Assignment {
  id: ID;
  teacherId: ID;
  subjectId: ID;
  sectionId: ID;
  yearId: ID;
}

export interface ExamType {
  id: ID;
  name: string;
  weight: number;
}
export interface Exam {
  id: ID;
  subjectId: ID;
  typeId: ID;
  termId: ID;
  totalMarks: number;
  date: string;
}

export interface UserAcc {
  id: ID;
  username: string;
  fullName: string;
  role: string;
  status: "active" | "disabled";
  lastLogin: string;
}

/* ------- seed ------- */

export const academicYears: AcademicYear[] = [
  { id: "y1", name: "١٤٤٥ هـ", startDate: "2023-09-01", endDate: "2024-06-15", isCurrent: false },
  { id: "y2", name: "١٤٤٦ هـ", startDate: "2024-09-01", endDate: "2025-06-15", isCurrent: true },
];
export const terms: Term[] = [
  { id: "t1", name: "الفصل الأول", yearId: "y2" },
  { id: "t2", name: "الفصل الثاني", yearId: "y2" },
  { id: "t3", name: "الفصل الثالث", yearId: "y2" },
];
export const grades: Grade[] = [
  { id: "g1", name: "الأول الابتدائي", order: 1 },
  { id: "g2", name: "الثاني الابتدائي", order: 2 },
  { id: "g3", name: "الثالث الابتدائي", order: 3 },
  { id: "g4", name: "الرابع الابتدائي", order: 4 },
  { id: "g5", name: "الخامس الابتدائي", order: 5 },
  { id: "g6", name: "السادس الابتدائي", order: 6 },
  { id: "g7", name: "الأول المتوسط", order: 7 },
  { id: "g8", name: "الثاني المتوسط", order: 8 },
];

export const sections: Section[] = [
  { id: "s1", name: "أ", gradeId: "g1", capacity: 30 },
  { id: "s2", name: "ب", gradeId: "g1", capacity: 30 },
  { id: "s3", name: "أ", gradeId: "g2", capacity: 28 },
  { id: "s4", name: "ب", gradeId: "g2", capacity: 28 },
  { id: "s5", name: "أ", gradeId: "g3", capacity: 32 },
  { id: "s6", name: "أ", gradeId: "g7", capacity: 30 },
  { id: "s7", name: "ب", gradeId: "g7", capacity: 30 },
];

export const subjects: Subject[] = [
  { id: "sub1", name: "الرياضيات", code: "MATH", creditHours: 5 },
  { id: "sub2", name: "اللغة العربية", code: "ARA", creditHours: 6 },
  { id: "sub3", name: "اللغة الإنجليزية", code: "ENG", creditHours: 4 },
  { id: "sub4", name: "العلوم", code: "SCI", creditHours: 4 },
  { id: "sub5", name: "الدراسات الاجتماعية", code: "SOC", creditHours: 3 },
  { id: "sub6", name: "التربية الإسلامية", code: "ISL", creditHours: 3 },
  { id: "sub7", name: "الحاسب الآلي", code: "CMP", creditHours: 2 },
  { id: "sub8", name: "التربية الفنية", code: "ART", creditHours: 1 },
];

export const guardians: Guardian[] = [
  { id: "p1", name: "سعد بن عبدالله الحربي", phone: "0501112233", email: "saad@example.com", occupation: "مهندس مدني", address: "حي النخيل، الرياض", relation: "أب" },
  { id: "p2", name: "خالد بن ناصر القحطاني", phone: "0502223344", email: "khaled@example.com", occupation: "طبيب", address: "حي العليا، الرياض", relation: "أب" },
  { id: "p3", name: "نوال بنت محمد الزهراني", phone: "0503334455", email: "nawal@example.com", occupation: "معلمة", address: "حي الورود، الرياض", relation: "أم" },
  { id: "p4", name: "عبدالرحمن الشمري", phone: "0504445566", email: "abdul@example.com", occupation: "محاسب", address: "حي الياسمين، الرياض", relation: "أب" },
];

const firstM = ["محمد", "أحمد", "عبدالله", "فيصل", "خالد", "ناصر", "يوسف", "سلطان"];
const firstF = ["نورة", "ريم", "هيا", "لمى", "سارة", "جواهر", "أمل", "دانة"];
const lasts = ["الحربي", "القحطاني", "الزهراني", "الشمري", "العتيبي", "الدوسري", "المالكي", "الغامدي"];

export const students: Student[] = Array.from({ length: 24 }).map((_, i) => {
  const gender: Gender = i % 2 === 0 ? "male" : "female";
  const first = gender === "male" ? firstM[i % firstM.length] : firstF[i % firstF.length];
  const last = lasts[i % lasts.length];
  const sec = sections[i % sections.length];
  return {
    id: `st${i + 1}`,
    admissionNo: `2024-${String(1000 + i)}`,
    firstName: first,
    middleName: "بن سعد",
    lastName: last,
    gender,
    birthDate: `2014-0${(i % 9) + 1}-12`,
    nationalId: `10${String(100000 + i)}`,
    phone: `0551${String(100000 + i).slice(-6)}`,
    email: `student${i + 1}@school.edu`,
    address: "الرياض، المملكة العربية السعودية",
    gradeId: sec.gradeId,
    sectionId: sec.id,
    status: "active",
    admissionDate: "2024-09-01",
    guardianId: guardians[i % guardians.length].id,
    attendanceRate: 80 + ((i * 7) % 20),
  };
});

export const teachers: Teacher[] = [
  { id: "te1", employeeNo: "T-1001", name: "أ. أحمد العتيبي", phone: "0561110011", email: "ahmed.o@school.edu", subjects: ["sub4", "sub1"], sections: ["s1", "s3", "s6"], status: "active" },
  { id: "te2", employeeNo: "T-1002", name: "أ. منى الزهراني", phone: "0561110022", email: "mona.z@school.edu", subjects: ["sub2"], sections: ["s2", "s4"], status: "active" },
  { id: "te3", employeeNo: "T-1003", name: "أ. سامي القحطاني", phone: "0561110033", email: "sami.q@school.edu", subjects: ["sub3"], sections: ["s5", "s6", "s7"], status: "active" },
  { id: "te4", employeeNo: "T-1004", name: "أ. لمى الحربي", phone: "0561110044", email: "lama.h@school.edu", subjects: ["sub6", "sub2"], sections: ["s1", "s2"], status: "leave" },
  { id: "te5", employeeNo: "T-1005", name: "أ. فيصل الشمري", phone: "0561110055", email: "faisal.s@school.edu", subjects: ["sub7"], sections: ["s6", "s7"], status: "active" },
];

export const assignments: Assignment[] = [
  { id: "a1", teacherId: "te1", subjectId: "sub4", sectionId: "s1", yearId: "y2" },
  { id: "a2", teacherId: "te1", subjectId: "sub1", sectionId: "s3", yearId: "y2" },
  { id: "a3", teacherId: "te2", subjectId: "sub2", sectionId: "s2", yearId: "y2" },
  { id: "a4", teacherId: "te3", subjectId: "sub3", sectionId: "s5", yearId: "y2" },
  { id: "a5", teacherId: "te3", subjectId: "sub3", sectionId: "s6", yearId: "y2" },
  { id: "a6", teacherId: "te5", subjectId: "sub7", sectionId: "s6", yearId: "y2" },
];

export const examTypes: ExamType[] = [
  { id: "et1", name: "اختبار قصير", weight: 10 },
  { id: "et2", name: "اختبار نصفي", weight: 30 },
  { id: "et3", name: "اختبار نهائي", weight: 60 },
];

export const exams: Exam[] = [
  { id: "ex1", subjectId: "sub1", typeId: "et2", termId: "t1", totalMarks: 30, date: "2026-06-22" },
  { id: "ex2", subjectId: "sub2", typeId: "et2", termId: "t1", totalMarks: 30, date: "2026-06-24" },
  { id: "ex3", subjectId: "sub3", typeId: "et1", termId: "t1", totalMarks: 10, date: "2026-06-18" },
  { id: "ex4", subjectId: "sub4", typeId: "et3", termId: "t1", totalMarks: 60, date: "2026-06-30" },
];

export const usersAccounts: UserAcc[] = [
  { id: "u1", username: "admin", fullName: "أحمد العتيبي", role: "مدير عام", status: "active", lastLogin: "2026-06-13 09:42" },
  { id: "u2", username: "principal01", fullName: "خالد القحطاني", role: "مدير مدرسة", status: "active", lastLogin: "2026-06-13 08:01" },
  { id: "u3", username: "registrar01", fullName: "نوال الزهراني", role: "أمين تسجيل", status: "active", lastLogin: "2026-06-12 14:22" },
  { id: "u4", username: "t.mona", fullName: "منى الزهراني", role: "معلم", status: "active", lastLogin: "2026-06-13 07:11" },
  { id: "u5", username: "g.saad", fullName: "سعد الحربي", role: "ولي أمر", status: "disabled", lastLogin: "2026-05-30 20:30" },
];

export const permissionsCatalog = [
  { group: "الطلاب", items: ["student.create", "student.update", "student.delete", "student.view"] },
  { group: "المعلمون", items: ["teacher.create", "teacher.update", "teacher.view"] },
  { group: "الحضور", items: ["attendance.take", "attendance.report"] },
  { group: "الاختبارات", items: ["exam.manage", "exam.results"] },
  { group: "الإدارة", items: ["users.manage", "roles.manage", "permissions.manage"] },
];

export const rolesCatalog = ["مدير عام", "مدير مدرسة", "أمين تسجيل", "معلم", "ولي أمر"];

/* helpers */
export const gradeOf = (id: ID) => grades.find((g) => g.id === id);
export const sectionOf = (id: ID) => sections.find((s) => s.id === id);
export const subjectOf = (id: ID) => subjects.find((s) => s.id === id);
export const teacherOf = (id: ID) => teachers.find((t) => t.id === id);
export const guardianOf = (id: ID) => guardians.find((g) => g.id === id);
export const studentOf = (id: ID) => students.find((s) => s.id === id);
export const studentsOfGuardian = (id: ID) => students.filter((s) => s.guardianId === id);
