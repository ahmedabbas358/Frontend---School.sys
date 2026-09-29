import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  CalendarDays, 
  ClipboardCheck, 
  FileText, 
  BarChart3, 
  GraduationCap, 
  Printer, 
  Award, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  FileSpreadsheet,
  Clock,
  ChevronDown
} from "lucide-react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { BlankGradeSheetModal } from "./blank-grade-sheet-modal";
import { BatchCertificatesModal } from "@/components/batch-certificates-modal";

export type ExamsTabKey = "schedule" | "grades" | "reports" | "archive";

interface ExamsNavTabsProps {
  activeTab: ExamsTabKey;
  // Optional callback if page wants to trigger blank sheet with specific context
  onOpenBlankSheet?: () => void;
  onOpenBatchCertificates?: () => void;
}

export function ExamsNavTabs({ 
  activeTab, 
  onOpenBlankSheet, 
  onOpenBatchCertificates 
}: ExamsNavTabsProps) {
  const { stage, getStageLabel } = useStage();
  const { 
    activeStageExams, 
    activeStageStudents, 
    activeStageExamSubjects, 
    allExamResults,
    systemSettings 
  } = useGlobalStore();

  // Internal modal states if parent didn't provide custom handlers
  const [internalBlankSheetOpen, setInternalBlankSheetOpen] = useState(false);
  const [internalCertificatesOpen, setInternalCertificatesOpen] = useState(false);

  // Live Metrics
  const totalExams = activeStageExams?.length || 0;
  const totalStudents = activeStageStudents?.length || 0;
  const totalExamSubjects = activeStageExamSubjects?.length || 0;
  
  // Grading progress calculation
  const totalPossibleGrades = totalStudents * Math.max(1, totalExamSubjects);
  const totalEnteredMarks = allExamResults?.length || 0;
  const gradingProgressPct = totalPossibleGrades > 0 
    ? Math.min(100, Math.round((totalEnteredMarks / totalPossibleGrades) * 100))
    : 0;

  const tabs = [
    {
      id: "schedule" as ExamsTabKey,
      label: "الجدولة والتخطيط وفترات الاختبارات",
      href: "/exams",
      icon: CalendarDays,
      badge: `${totalExams} فترات`,
      badgeColor: "bg-primary/10 text-primary border-primary/20",
      description: "فترات الاختبارات، جداول الفصول، وتوزيع اللجان والقاعات"
    },
    {
      id: "grades" as ExamsTabKey,
      label: "رصد الدرجات وكشوف الحصر والاستوديو",
      href: "/exams/grades",
      icon: ClipboardCheck,
      badge: `${gradingProgressPct}% مرصود`,
      badgeColor: gradingProgressPct > 70 
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      description: "رصد درجات المقررات، الكشف الشامل، واستوديو القواعد والأوزان"
    },
    {
      id: "reports" as ExamsTabKey,
      label: "التقارير والشيت الماستر والشهادات",
      href: "/exams/reports",
      icon: FileText,
      badge: "شيت عام وشهادات",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      description: "الشيت العام الماستر، إشعارات الدرجات، والشهادات المجمعة"
    },
    {
      id: "archive" as ExamsTabKey,
      label: "أرشيف النتائج والتحليلات والقياس",
      href: "/exams/archive",
      icon: BarChart3,
      badge: "مؤشرات وقياس",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      description: "سجل النتائج التراكمي، لوحة القياس، ومقارنة أداء الشعب"
    },
  ];

  return (
    <>
      <div className="space-y-4 mb-6">
        {/* MODULE HEADER BAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-card via-card to-primary/5 border border-border/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20">
                <GraduationCap className="w-3.5 h-3.5" />
                {getStageLabel(stage)}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                نظام الاختبارات والكنترول نشط
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                العام الدراسي: <strong>{systemSettings?.schoolName || "مدرسة داراسي النموذجية"}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <span>منظومة الاختبارات والكنترول وشيت الدرجات والشهادات</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl">
              إدارة شاملة لجميع مراحل التقويم: التخطيط والجدولة، استخراج كشوف الرصد اليدوية للمعلمين، رصد الدرجات الإلكتروني، الشيت الماستر، وطباعة الشهادات المجمعة
            </p>
          </div>

          {/* QUICK ACTION BUTTONS */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* 1. Blank Grade Sheet Button (Requested by User) */}
            <button
              type="button"
              onClick={() => {
                if (onOpenBlankSheet) onOpenBlankSheet();
                else setInternalBlankSheetOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="طباعة كشف رصد ورقي فارغ أو مسودة لتسليمه لمعلم المادة"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>كشف رصد درجات يدوي (للمعلم)</span>
            </button>

            {/* 2. Batch Certificates Button */}
            <button
              type="button"
              onClick={() => {
                if (onOpenBatchCertificates) onOpenBatchCertificates();
                else setInternalCertificatesOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="تصدير وطباعة شهادات الطلاب مجمعة ومخصصة"
            >
              <Award className="w-4 h-4" />
              <span>طباعة الشهادات المجمعة</span>
            </button>
          </div>
        </div>

        {/* PRIMARY ROUTE TABS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={tab.href}
                className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                  isActive
                    ? "bg-card border-primary text-foreground shadow-md ring-2 ring-primary/20"
                    : "bg-card/70 border-border/70 text-muted-foreground hover:text-foreground hover:bg-card hover:border-border hover:shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isActive 
                        ? "bg-primary text-white shadow-xs" 
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    }`}>
                      <tab.icon className="w-4 h-4" />
                    </div>
                    <span className="font-black text-xs sm:text-sm text-foreground">
                      {tab.label}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1">
                  {tab.description}
                </p>

                {isActive && (
                  <div className="absolute bottom-0 inset-x-6 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Internal Modals */}
      {internalBlankSheetOpen && (
        <BlankGradeSheetModal
          isOpen={internalBlankSheetOpen}
          onClose={() => setInternalBlankSheetOpen(false)}
        />
      )}

      {internalCertificatesOpen && (
        <BatchCertificatesModal
          isOpen={internalCertificatesOpen}
          onClose={() => setInternalCertificatesOpen(false)}
        />
      )}
    </>
  );
}
