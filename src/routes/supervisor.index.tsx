import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import {
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  QrCode,
  Sparkles,
  ExternalLink,
  Layers,
  Building2,
  Calendar,
  Share2,
  Copy,
  Check,
  UserCheck,
  Shield,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/supervisor/")({
  component: SupervisorHubPage,
});

export function SupervisorHubPage() {
  const {
    allStudents,
    allStaff,
    allAttendanceSessions,
    allAttendanceRecords,
    allStaffAttendance,
    activeStageSections,
  } = useGlobalStore();

  const { stage, getStageLabel } = useStage();

  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Today's student attendance stats
  const todayStudentStats = useMemo(() => {
    const todaySessions = allAttendanceSessions.filter((s) => s.date === todayDate);
    const sessionIds = new Set(todaySessions.map((s) => s.id));
    const todayRecords = allAttendanceRecords.filter((r) => sessionIds.has(r.sessionId));

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    todayRecords.forEach((r) => {
      if (r.status === "PRESENT") present++;
      else if (r.status === "ABSENT") absent++;
      else if (r.status === "LATE") late++;
      else if (r.status === "EXCUSED") excused++;
    });

    return {
      sessionsCount: todaySessions.length,
      totalRecords: todayRecords.length,
      present,
      absent,
      late,
      excused,
    };
  }, [allAttendanceSessions, allAttendanceRecords, todayDate]);

  // Today's staff / worker stats
  const todayStaffStats = useMemo(() => {
    const todayRecords = allStaffAttendance.filter((r) => r.date === todayDate);
    let inside = 0;
    let late = 0;
    let checkedOut = 0;

    todayRecords.forEach((r) => {
      if (r.checkOut) {
        checkedOut++;
      } else if (r.checkIn) {
        inside++;
        if (r.status === "late") late++;
      }
    });

    const activeWorkersCount = allStaff.filter((s) => !s.isDeleted && s.status !== "terminated").length;
    const notArrived = Math.max(0, activeWorkersCount - (inside + checkedOut));

    return {
      totalWorkers: activeWorkersCount,
      inside,
      late,
      checkedOut,
      notArrived,
    };
  }, [allStaffAttendance, allStaff, todayDate]);

  // Copy mobile link to clipboard
  const copyLink = (path: string, label: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    toast.success(`تم نسخ رابط ${label} إلى الحافظة!`, {
      description: "يمكنك إرساله عبر واتساب إلى هواتف المشرفين مباشرة.",
    });
  };

  // Mock Floor Supervisors Assignment
  const supervisorsList = [
    {
      id: "SUP-01",
      name: "أ. محمد الفاتح إبراهيم",
      role: "مشرف دور - المرحلة الابتدائية",
      assignedStage: "الابتدائية",
      assignedFloor: "الدور الأرضي (الصفوف 1 - 3)",
      phone: "0501234567",
      status: "نشط الآن",
    },
    {
      id: "SUP-02",
      name: "أ. طارق عبدالكريم الشمري",
      role: "مشرف دور - المرحلة المتوسطة",
      assignedStage: "المتوسطة",
      assignedFloor: "الدور الأول (الفصول 1/1 إلى 3/3)",
      phone: "0507654321",
      status: "نشط الآن",
    },
    {
      id: "SUP-03",
      name: "أ. ياسر منصور العتيبي",
      role: "مشرف دور - المرحلة الثانوية",
      assignedStage: "الثانوية",
      assignedFloor: "الدور الثاني والمختبرات",
      phone: "0559876543",
      status: "نشط الآن",
    },
    {
      id: "SUP-04",
      name: "أ. عبدالله فهد المطيري",
      role: "المشرف العام - بوابة الاستقبال والحركة",
      assignedStage: "جميع المراحل والخدمات",
      assignedFloor: "البوابة الرئيسية وبوابة الخدمات",
      phone: "0543219876",
      status: "على البوابة",
    },
  ];

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الحضور والانضباط", to: "/attendance" },
        { label: "بوابة وتطبيقات المشرفين" },
      ]}
    >
      <div className="space-y-6 max-w-6xl mx-auto font-sans" dir="rtl">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>نظام الحضور الميداني المتنقل • خفيف وسريع للهواتف</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                بوابة المشرفين الميدانيين وتطبيقات الحضور
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                حل متكامل ينهي عبء الإدخال اليدوي الورقي؛ حيث يوزع على هواتف مشرفي الفصول
                لرصد الطلاب بنقرة واحدة، وتطبيق المشرف العام عند البوابة لتحضير العمال
                وكافة الكوادر فورياً لحظة مرورهم.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              <Link
                to="/supervisor/classes"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>تطبيق رصد الفصول</span>
              </Link>

              <Link
                to="/supervisor/gate"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 backdrop-blur-md transition-all active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>بوابة تحضير العمال</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Live Overview Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                جلسات رصد الطلاب اليوم
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {todayStudentStats.sessionsCount}
              </span>
              <span className="text-xs text-slate-500">فصلاً معتمداً</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">🟢 {todayStudentStats.present} حاضر</span>
              <span>•</span>
              <span className="text-rose-600 font-bold">🔴 {todayStudentStats.absent} غائب</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                العمال والكادر بالداخل الآن
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {todayStaffStats.inside}
              </span>
              <span className="text-xs text-slate-500">موظف وعامل حاضر</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>تأخر {todayStaffStats.late} موظفاً</span>
              <span>•</span>
              <span>انصرف {todayStaffStats.checkedOut}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                المشرفون الميدانيون
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {supervisorsList.length}
              </span>
              <span className="text-xs text-slate-500">مشرفين موكلين</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-600 font-medium">
              جميع المشرفين مرتبطون بالنظام
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                حالة مزامنة البيانات
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                متصل ومزامن لحظياً
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              تكامل تلقائي مع شؤون الموظفين والدرجات
            </div>
          </div>
        </div>

        {/* 2 Main Mobile Portals Showcase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portal 1: Class Supervisors */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  مخصص لمشرفي الأدوار
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                تطبيق رصد حضور الفصول (للطلاب)
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                واجهة مخصصة للهاتف المحمول تمكن المشرف من التنقل بين الفصول والشعب،
                ورصد كامل الفصل بضغطة زر واحدة (تحضير الكل كحاضر)، ثم استثناء الغائبين
                والمتأخرين في ثوانٍ معدودة دون الحاجة لحمل أوراق.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">طريقة العمل</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    رصد سريع + زر 1-Tap للكل
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">المزامنة</span>
                  <span className="font-bold text-emerald-600">
                    حفظ مباشر في السجل العام
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/supervisor/classes"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 text-center transition-all"
              >
                فتح التطبيق الآن
              </Link>
              <button
                onClick={() => copyLink("/supervisor/classes", "تطبيق رصد الفصول")}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                title="نسخ رابط الهاتف للمشرفين"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Portal 2: Gatekeeper App */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  مخصص للمشرف العام والبوابة
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                بوابة تحضير العمال والكادر (الاستقبال)
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                واجهة متصلة عند بوابة الدخول والخروج تسمح للمشرف بتسجيل دخول وانصراف
                عمال النظافة، الصيانة، الأمن، سائقي الحافلات، والكادر التعليمي أثناء
                مرورهم، مع احتساب توقيت الدخول الدقيق والتأخيرات تلقائياً.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">الفئات المشمولة</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    عمال النظافة، الصيانة، الحراس
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">التأخير الصباحي</span>
                  <span className="font-bold text-amber-600">
                    احتساب آلي بعد 07:15 ص
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/supervisor/gate"
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-md shadow-slate-900/20 text-center transition-all hover:opacity-95"
              >
                فتح شاشة البوابة الآن
              </Link>
              <button
                onClick={() => copyLink("/supervisor/gate", "بوابة تحضير العمال")}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                title="نسخ رابط شاشة البوابة"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Assigned Floor Supervisors Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                قائمة المشرفين الميدانيين وتوزيع الأدوار
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                توزيع مشرفي الأدوار والمراحل وتزويدهم بروابط الدخول السريع
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/academic/classes"
                className="text-xs font-bold text-primary hover:underline"
              >
                تعديل الشعب والفصول
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-3 px-4 font-bold">المشرف الميداني</th>
                  <th className="py-3 px-4 font-bold">المهمة / الدور</th>
                  <th className="py-3 px-4 font-bold">المرحلة والموقع</th>
                  <th className="py-3 px-4 font-bold">رقم التواصل</th>
                  <th className="py-3 px-4 font-bold">الحالة</th>
                  <th className="py-3 px-4 font-bold text-center">رابط الوصول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {supervisorsList.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {sup.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {sup.role}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {sup.assignedStage}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {sup.assignedFloor}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {sup.phone}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {sup.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => copyLink("/supervisor/classes", `رابط ${sup.name}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>نسخ الرابط</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
