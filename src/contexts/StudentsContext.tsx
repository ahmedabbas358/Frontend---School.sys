import React, { createContext, useContext, useState, ReactNode } from "react";
import { EducationalStage } from "./StageContext";

export interface BaseStudent {
  id: string;
  name: string;
  dob: string;
  nationalId: string;
  guardianName: string;
  stage: EducationalStage;
  grade: string;
}

export interface KindergartenStudent extends BaseStudent {
  stage: "kindergarten";
  pickupPersons: string;
  allergies: string;
  specialCare: boolean;
}

export interface HighSchoolStudent extends BaseStudent {
  stage: "high";
  major: "science" | "literature";
  elective: string;
}

export type Student = BaseStudent | KindergartenStudent | HighSchoolStudent;

interface StudentsContextType {
  students: Student[];
  addStudent: (student: Omit<Student, "id">) => void;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

// Some initial mock data
const initialStudents: Student[] = [
  {
    id: "STU-1001",
    name: "أحمد محمد محمود",
    dob: "2015-05-12",
    nationalId: "1029384756",
    guardianName: "محمد محمود",
    stage: "primary",
    grade: "الصف الثالث الابتدائي",
  },
  {
    id: "STU-1002",
    name: "سارة خالد السعيد",
    dob: "2019-02-20",
    nationalId: "1122334455",
    guardianName: "خالد السعيد",
    stage: "kindergarten",
    grade: "الروضة المتقدمة",
    pickupPersons: "خالد السعيد، نورة الأحمد",
    allergies: "لا يوجد",
    specialCare: false,
  },
];

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(initialStudents);

  const addStudent = (studentData: Omit<Student, "id">) => {
    const newStudent = {
      ...studentData,
      id: `STU-${Math.floor(1000 + Math.random() * 9000)}`, // Generate mock ID
    } as Student;
    
    setStudents((prev) => [newStudent, ...prev]);
  };

  return (
    <StudentsContext.Provider value={{ students, addStudent }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error("useStudents must be used within a StudentsProvider");
  }
  return context;
}
