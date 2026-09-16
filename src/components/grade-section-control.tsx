import React from "react";
import { GraduationCap, Users, Layers, Sparkles } from "lucide-react";

export interface SectionItem {
  id: string;
  name: string;
  grade: string;
  homeroomTeacher?: string;
  capacity?: number;
}

interface GradeSectionPillsProps {
  grades: string[];
  selectedGrade: string;
  onSelectGrade: (grade: string) => void;
  sections: SectionItem[];
  selectedSectionId: string;
  onSelectSectionId: (sectionId: string) => void;
  showAllGrades?: boolean;
  showAllSections?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function GradeSectionPills({
  grades,
  selectedGrade,
  onSelectGrade,
  sections,
  selectedSectionId,
  onSelectSectionId,
  showAllGrades = false,
  showAllSections = false,
  className = "",
  size = "md"
}: GradeSectionPillsProps) {
  // Filter sections belonging to selected grade (unless all grades is selected)
  const availableSections = React.useMemo(() => {
    if (selectedGrade === "all") return sections;
    return sections.filter(s => s.grade === selectedGrade);
  }, [sections, selectedGrade]);

  const isSmall = size === "sm";

  return (
    <div className={`space-y-3 ${className}`} dir="rtl">
      {/* 1. Grade Selector Pills */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5 text-primary" />
          <span>الصف الدراسي:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {showAllGrades && (
            <button
              type="button"
              onClick={() => {
                onSelectGrade("all");
                if (showAllSections) onSelectSectionId("all");
              }}
              className={`rounded-xl font-black transition-all shrink-0 flex items-center gap-1.5 ${
                isSmall ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-xs"
              } ${
                selectedGrade === "all"
                  ? "bg-primary text-primary-foreground shadow-xs glow-primary scale-[1.02]"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
              }`}
            >
              <span>كافة الصفوف</span>
            </button>
          )}
          {grades.map(grade => {
            const isSelected = selectedGrade === grade;
            const count = sections.filter(s => s.grade === grade).length;
            return (
              <button
                key={grade}
                type="button"
                onClick={() => {
                  onSelectGrade(grade);
                  // Auto-select first section of this grade if current section is not in this grade
                  const firstSec = sections.find(s => s.grade === grade);
                  if (firstSec && !sections.some(s => s.grade === grade && s.id === selectedSectionId)) {
                    onSelectSectionId(firstSec.id);
                  }
                }}
                className={`rounded-xl font-black transition-all shrink-0 flex items-center gap-1.5 ${
                  isSmall ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-xs"
                } ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs glow-primary scale-[1.02]"
                    : "bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
                }`}
              >
                <span>{grade}</span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count} شعب
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Section Selector Pills */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>الشعبة والفصل:</span>
          </div>
          {availableSections.length > 0 && (
            <span className="text-[11px] text-muted-foreground/80 font-medium">
              {availableSections.length} شعبة متوفرة
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {showAllSections && (
            <button
              type="button"
              onClick={() => onSelectSectionId("all")}
              className={`rounded-xl font-black transition-all shrink-0 flex items-center gap-1.5 ${
                isSmall ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-xs"
              } ${
                selectedSectionId === "all"
                  ? "bg-secondary text-secondary-foreground shadow-xs font-black ring-2 ring-primary/40 scale-[1.02]"
                  : "bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40"
              }`}
            >
              <span>كافة الشُعب</span>
            </button>
          )}
          {availableSections.length === 0 ? (
            <div className="text-xs text-muted-foreground py-1">لا توجد شعب مسجلة لهذا الصف.</div>
          ) : (
            availableSections.map(sec => {
              const isSelected = selectedSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onSelectSectionId(sec.id)}
                  className={`rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isSmall ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-xs"
                  } ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs glow-primary font-black scale-[1.02]"
                      : "bg-card hover:bg-muted text-foreground border border-border/70"
                  }`}
                >
                  <span>شعبة ({sec.name})</span>
                  {sec.homeroomTeacher && (
                    <span
                      className={`text-[10px] font-normal px-1 rounded-md ${
                        isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      رائد: {sec.homeroomTeacher}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Filter Bar for Modals (Incident, Merit, Student Picker)
 * Allows narrowing down students by grade and section
 */
export function ModalStudentGradeSectionFilter({
  grades,
  selectedGrade,
  onSelectGrade,
  sections,
  selectedSectionId,
  onSelectSectionId,
  onReset
}: {
  grades: string[];
  selectedGrade: string;
  onSelectGrade: (g: string) => void;
  sections: SectionItem[];
  selectedSectionId: string;
  onSelectSectionId: (s: string) => void;
  onReset?: () => void;
}) {
  const filteredSections = React.useMemo(() => {
    if (!selectedGrade) return sections;
    return sections.filter(s => s.grade === selectedGrade);
  }, [sections, selectedGrade]);

  return (
    <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 space-y-2.5" dir="rtl">
      <div className="flex items-center justify-between text-xs font-black text-foreground">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-primary" />
          تصفية وحصر الطلاب حسب الصف والشعبة:
        </span>
        {(selectedGrade || selectedSectionId) && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-bold text-destructive hover:underline cursor-pointer"
          >
            إعادة تعيين الكل
          </button>
        )}
      </div>

      {/* Grade Selector */}
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => {
            onSelectGrade("");
            onSelectSectionId("");
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            !selectedGrade
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "bg-background/80 hover:bg-muted text-muted-foreground border border-border/50"
          }`}
        >
          كل الصفوف
        </button>
        {grades.map(g => (
          <button
            key={g}
            type="button"
            onClick={() => {
              onSelectGrade(g);
              onSelectSectionId("");
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedGrade === g
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-background/80 hover:bg-muted text-muted-foreground border border-border/50"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Section Selector */}
      {selectedGrade && filteredSections.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border/40">
          <span className="text-[11px] font-bold text-muted-foreground ml-1">الشعبة:</span>
          <button
            type="button"
            onClick={() => onSelectSectionId("")}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
              !selectedSectionId
                ? "bg-secondary text-secondary-foreground font-black"
                : "bg-background/80 hover:bg-muted text-muted-foreground border border-border/50"
            }`}
          >
            الكل
          </button>
          {filteredSections.map(sec => (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSectionId(sec.id)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                selectedSectionId === sec.id
                  ? "bg-primary text-primary-foreground font-black"
                  : "bg-background/80 hover:bg-muted text-muted-foreground border border-border/50"
              }`}
            >
              شعبة {sec.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
