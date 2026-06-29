import { EducationalStage, getConfiguredGrades, isConfiguredGrade } from "@/contexts/StageContext";

export type SchoolClass = {
  id: string;
  stage: EducationalStage;
  grade: string;
  name: string;
};

type StageGradeScoped = {
  stage: EducationalStage | "all";
  grades?: string[];
};

type SectionLike = {
  id: string;
  name: string;
  grade: string;
  stage: EducationalStage;
  classId?: string;
};

export const makeClassId = (stage: EducationalStage, grade: string) => `${stage}:${grade}:main`;

export const getSectionClassId = (section: SectionLike) => {
  return section.classId || makeClassId(section.stage, section.grade);
};

export const getClassesForGrade = (stage: EducationalStage, grade: string, sections: SectionLike[] = []): SchoolClass[] => {
  if (!isConfiguredGrade(stage, grade)) return [];

  const classMap = new Map<string, SchoolClass>();
  const gradeSections = sections.filter(section => section.stage === stage && section.grade === grade);

  gradeSections.forEach(section => {
    const id = getSectionClassId(section);
    classMap.set(id, {
      id,
      stage,
      grade,
      name: id === makeClassId(stage, grade) ? `فصل ${grade}` : id,
    });
  });

  if (classMap.size === 0) {
    const id = makeClassId(stage, grade);
    classMap.set(id, { id, stage, grade, name: `فصل ${grade}` });
  }

  return Array.from(classMap.values());
};

export const getSectionsForClass = (sections: SectionLike[], stage: EducationalStage, grade: string, classId: string) => {
  if (!isConfiguredGrade(stage, grade)) return [];
  return sections.filter(section => (
    section.stage === stage &&
    section.grade === grade &&
    getSectionClassId(section) === classId
  ));
};

export const isItemAllowedForGrade = (item: StageGradeScoped, stage: EducationalStage, grade: string) => {
  if (!isConfiguredGrade(stage, grade)) return false;
  const stageMatches = item.stage === "all" || item.stage === stage;
  const gradeMatches = !item.grades || item.grades.length === 0 || item.grades.includes(grade);
  return stageMatches && gradeMatches;
};

export const getGradesForStage = (stage: EducationalStage) => getConfiguredGrades(stage);
