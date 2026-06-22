import React, { createContext, useContext, useState, ReactNode } from "react";

export type EducationalStage = "kindergarten" | "primary" | "middle" | "high";

export const STAGE_LIST: { id: EducationalStage; name: string }[] = [
  { id: "kindergarten", name: "رياض الأطفال" },
  { id: "primary", name: "المرحلة الابتدائية" },
  { id: "middle", name: "المرحلة المتوسطة" },
  { id: "high", name: "المرحلة الثانوية" },
];

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
