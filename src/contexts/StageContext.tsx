import React, { createContext, useContext, useState, ReactNode } from "react";

export type EducationalStage = "kindergarten" | "primary" | "middle" | "high";

export const SCHOOL_STRUCTURE_CONFIG = {
  preschool: 2,
  primary: 6,
  middle: 3,
  secondary: 3,
} as const;

export const STAGE_STRUCTURE_KEYS: Record<EducationalStage, keyof typeof SCHOOL_STRUCTURE_CONFIG> = {
  kindergarten: "preschool",
  primary: "primary",
  middle: "middle",
  high: "secondary",
};

export const STAGE_LIST: { id: EducationalStage; name: string }[] = [
  { id: "kindergarten", name: "رياض الأطفال" },
  { id: "primary", name: "المرحلة الابتدائية" },
  { id: "middle", name: "المرحلة المتوسطة" },
  { id: "high", name: "المرحلة الثانوية" },
];

export const GRADE_OPTIONS: Record<EducationalStage, string[]> = {
  kindergarten: ["روضة 1", "روضة 2"],
  primary: ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع", "الصف الخامس", "الصف السادس"],
  middle: ["الصف الأول المتوسط", "الصف الثاني المتوسط", "الصف الثالث المتوسط"],
  high: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"],
};

export const getConfiguredGrades = (stage: EducationalStage) => {
  const count = SCHOOL_STRUCTURE_CONFIG[STAGE_STRUCTURE_KEYS[stage]];
  return GRADE_OPTIONS[stage].slice(0, count);
};

export const isConfiguredGrade = (stage: EducationalStage, grade: string) => {
  return getConfiguredGrades(stage).includes(grade);
};

interface StageContextType {
  stage: EducationalStage;
  setStage: (stage: EducationalStage) => void;
  getStageLabel: (stage: EducationalStage) => string;
  stages: { id: EducationalStage; name: string }[];
}

const StageContext = createContext<StageContextType | undefined>(undefined);

const stageLabels: Record<EducationalStage, string> = {
  kindergarten: "رياض الأطفال",
  primary: "المرحلة الابتدائية",
  middle: "المرحلة المتوسطة",
  high: "المرحلة الثانوية",
};

export function StageProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<EducationalStage>("primary");

  const getStageLabel = (s: EducationalStage) => stageLabels[s];

  return (
    <StageContext.Provider value={{ stage, setStage, getStageLabel, stages: STAGE_LIST }}>
      {children}
    </StageContext.Provider>
  );
}

export function useStage() {
  const context = useContext(StageContext);
  if (context === undefined) {
    throw new Error("useStage must be used within a StageProvider");
  }
  return context;
}
