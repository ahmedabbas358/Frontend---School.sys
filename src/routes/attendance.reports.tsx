import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  FileWarning, 
  Search, 
  Filter, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle,
  Share2,
  ExternalLink,
  ShieldAlert,
  ArrowDownRight,
  TrendingDown,
  UserCheck
} from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { AttendanceDisciplineNav } from "@/components/attendance/attendance-nav";
import { toast } from "sonner";

export const Route = createFileRoute("/attendance/reports")({
  head: () => ({ 
    meta: [
      { title: "لوحة تحليلات ومؤشرات الحضور والغياب | منصة مدارس" },
      { name: "description", content: "تحليل نسب الحضور، اكتشاف التسرب الدراسي والغياب المتكرر، وإصدار الإنذارات الرسمية" }
    ] 
  }),
  component: AttendanceReportsPage,
});

const PIE_COLORS = ["#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

function AttendanceReportsPage() {
  const { stage, getStageLabel } = useStage();
  const { 
    activeStageStudents, 
    activeStageSections, 
    allAttendanceSessions, 
    allAttendanceRecords, 
    allStudentEnrollments, 
    currentAcademicYearId,
    activeAcademicTerm,
    systemSettings 
  } = useGlobalStore();

  const [searchQ, setSearchQ] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printSelectedStudent, setPrintSelectedStudent] = useState<any>(null);

  const availableGrades = useMemo(() => {
    return Array.from(new Set(activeStageSections.map(s => s.grade))).filter(Boolean);
  }, [activeStageSections]);

  // Filter sections by selected grade
  const filteredSections = useMemo(() => {
    if (!selectedGrade) return activeStageSections;
    return activeStageSections.filter(s => s.grade === selectedGrade);
  }, [activeStageSections, selectedGrade]);

  // Filtered Students list based on search and grade/section
  const filteredStudents = useMemo(() => {
    return activeStageStudents.filter(s => {
      if (searchQ && !s.name.includes(searchQ) && !s.nationalId.includes(searchQ)) return false;
      if (selectedGrade && s.grade !== selectedGrade) return false;
      if (selectedSectionId) {
        const enrollment = allStudentEnrollments.find(e => e.studentId === s.id && e.academicYearId === currentAcademicYearId);
        const secId = enrollment?.sectionId || s.sectionId;
        if (secId !== selectedSectionId) return false;
      }
      return true;
    });
  }, [activeStageStudents, searchQ, selectedGrade, selectedSectionId, allStudentEnrollments, currentAcademicYearId]);

  // Compute student-by-student attendance records aggregate
  const studentAttendanceSummary = useMemo(() => {
    return filteredStudents.map(student => {
      const enrollment = allStudentEnrollments.find(e => e.studentId === student.id && e.academicYearId === currentAcademicYearId);
      const enrollmentId = enrollment?.id || student.id;
      const section = activeStageSections.find(sec => sec.id === (enrollment?.sectionId || student.sectionId));

      // Filter records
      const studentRecords = allAttendanceRecords.filter(r => {
        if (r.studentEnrollmentId !== enrollmentId && r.studentEnrollmentId !== student.id) return false;
        if (dateFrom && r.markedAt && r.markedAt.slice(0, 10) < dateFrom) return false;
        if (dateTo && r.markedAt && r.markedAt.slice(0, 10) > dateTo) return false;
        return true;
      });

      const totalRecorded = studentRecords.length;
      const presentCount = studentRecords.filter(r => r.status === "PRESENT").length;
      const lateCount = studentRecords.filter(r => r.status === "LATE").length;
      const absentCount = studentRecords.filter(r => r.status === "ABSENT").length;
      const excusedCount = studentRecords.filter(r => r.status === "EXCUSED").length;

      const attendanceRate = totalRecorded > 0 
        ? Math.round(((presentCount + lateCount) / totalRecorded) * 100)
        : 100;

      return {
        student,
        enrollmentId,
        studentName: student.name,
        nationalId: student.nationalId || "—",
        grade: student.grade,
        sectionName: section?.name || "عامة",
        totalRecorded,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        attendanceRate,
        isCritical: absentCount >= 5,
        isWarning: absentCount >= 3 && absentCount < 5,
      };
    });
  }, [filteredStudents, allStudentEnrollments, currentAcademicYearId, activeStageSections, allAttendanceRecords, dateFrom, dateTo]);

  // Overall KPI statistics
  const kpiStats = useMemo(() => {
    const totalStudents = studentAttendanceSummary.length;
    const totalAbsences = studentAttendanceSummary.reduce((sum, s) => sum + s.absentCount, 0);
    const totalLates = studentAttendanceSummary.reduce((sum, s) => sum + s.lateCount, 0);
    const totalPresent = studentAttendanceSummary.reduce((sum, s) => sum + s.presentCount, 0);
    const totalExcused = studentAttendanceSummary.reduce((sum, s) => sum + s.excusedCount, 0);

    const totalSessionsRecorded = totalPresent + totalAbsences + totalLates + totalExcused;
    const overallRate = totalSessionsRecorded > 0
      ? Math.round(((totalPresent + totalLates) / totalSessionsRecorded) * 100)
      : 96;

    const criticalStudents = studentAttendanceSummary.filter(s => s.isCritical).length;
    const warningStudents = studentAttendanceSummary.filter(s => s.isWarning).length;

    return {
      totalStudents,
      overallRate,
      totalAbsences,
      totalLates,
      criticalStudents,
      warningStudents,
      totalExcused
    };
  }, [studentAttendanceSummary]);

  // Trend data for line chart (computed or distributed across recent days)
  const attendanceTrendData = useMemo(() => {
    const dayMap: Record<string, { total: number; present: number }> = {};
    
    allAttendanceSessions.forEach(session => {
      if (!dayMap[session.date]) {
        dayMap[session.date] = { total: 0, present: 0 };
      }
    });

    allAttendanceRecords.forEach(rec => {
      const d = rec.markedAt ? rec.markedAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
      if (!dayMap[d]) dayMap[d] = { total: 0, present: 0 };
      dayMap[d].total += 1;
      if (rec.status === "PRESENT" || rec.status === "LATE") {
        dayMap[d].present += 1;
      }
    });

    const entries = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) {
      return [
        { date: "الأحد", rate: 96 },
        { date: "الإثنين", rate: 94 },
        { date: "الثلاثاء", rate: 97 },
        { date: "الأربعاء", rate: 93 },
        { date: "الخميس", rate: 95 },
      ];
    }

    return entries.slice(-7).map(([dateStr, stat]) => ({
      date: dateStr.slice(5),
      rate: stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 95
    }));
  }, [allAttendanceSessions, allAttendanceRecords]);

  // Pie Chart distribution
  const statusDistribution = useMemo(() => {
    const present = studentAttendanceSummary.reduce((sum, s) => sum + s.presentCount, 0);
    const late = studentAttendanceSummary.reduce((sum, s) => sum + s.lateCount, 0);
    const absent = studentAttendanceSummary.reduce((sum, s) => sum + s.absentCount, 0);
    const excused = studentAttendanceSummary.reduce((sum, s) => sum + s.excusedCount, 0);

    const total = present + late + absent + excused;
    if (total === 0) {
      return [
        { name: "حضور كامل", value: 85 },
        { name: "تأخر دراسي", value: 5 },
        { name: "غياب بدون عذر", value: 7 },
        { name: "غياب بعذر", value: 3 },
      ];
    }

    return [
      { name: "حضور كامل", value: present },
      { name: "تأخر دراسي", value: late },
      { name: "غياب بدون عذر", value: absent },
      { name: "غياب بعذر", value: excused },
    ];
  }, [studentAttendanceSummary]);

  // Section comparison data for bar chart
  const sectionBarData = useMemo(() => {
    return activeStageSections.slice(0, 6).map(sec => {
      const studentsInSec = studentAttendanceSummary.filter(s => s.sectionName === sec.name || s.student.sectionId === sec.id);
      const absCount = studentsInSec.reduce((sum, s) => sum + s.absentCount, 0);
      return {
        section: `${sec.grade?.slice(0, 5) || "صف"} (${sec.name})`,
        absences: absCount
      };
    });
  }, [activeStageSections, studentAttendanceSummary]);

  // Sorted list of students with highest absences
  const topAbsentStudents = useMemo(() => {
    return [...studentAttendanceSummary]
      .filter(s => s.absentCount > 0 || s.lateCount > 0)
      .sort((a, b) => b.absentCount - a.absentCount || a.attendanceRate - b.attendanceRate);
  }, [studentAttendanceSummary]);

  // Print templates
  const printTemplates: PrintTemplate[] = [
    {
      id: "attendance-analytics-report",
      name: "تقرير التحليلات والمؤشرات الشامل للحضور",
      category: "تقارير الحضور",
      type: "table",
      description: "كشف حصر رسمي بمعدلات الحضور ونسب الغياب لكافة الطلاب والصفوف",
      columns: [
        { label: "اسم الطالب", key: "studentName" },
        { label: "الصف والشعبة", key: "grade", render: (r) => `${r.grade} (${r.sectionName})` },
        { label: "حاضر", key: "presentCount" },
        { label: "متأخر", key: "lateCount" },
        { label: "غياب بدون عذر", key: "absentCount" },
        { label: "غياب بعذر", key: "excusedCount" },
        { label: "نسبة الحضور", key: "attendanceRate", render: (r) => `${r.attendanceRate}%` },
        { 
          label: "الحالة", 
          key: "status", 
          render: (r) => r.isCritical ? "إنذار حرج" : r.isWarning ? "إنذار أولي" : "منضبط" 
        },
      ]
    },
    {
      id: "official-absence-warning",
      name: "خطاب إنذار غياب رسمي لولي الأمر",
      category: "الخطابات والإنذارات",
      type: "document",
      description: "إشعار رسمي بإنذار لتجاوز الحد المسموح من أيام الغياب وفق لائحة السلوك والمواظبة",
      renderDocument: (item: any) => {
        const studentRow = item || printSelectedStudent || topAbsentStudents[0] || {};
        return (
          <div className="p-8 bg-white text-gray-900 border-2 border-gray-800 rounded-2xl space-y-6" dir="rtl">
            <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4">
              <div className="text-right text-xs">
                <p className="font-black text-primary">المملكة العربية السعودية</p>
                <p className="font-bold">وزارة التعليم • منصة مدارس النموذجية</p>
                <p className="text-gray-600">إدارة شؤون الطلاب • قسم الحضور والمواظبة</p>
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-black text-destructive">خطاب إنذار غياب رسمي</h1>
                <p className="text-xs font-bold text-gray-700 mt-1">تنبيه لتجاوز نسبة الغياب المقررة</p>
              </div>
              <div className="text-left text-xs font-bold">
                <div>التاريخ: {new Date().toISOString().slice(0, 10)}</div>
                <div>المرحلة: {getStageLabel(stage)}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-300 bg-gray-50 text-xs font-bold space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>المكرم ولي أمر الطالب: <span className="font-black text-base">{studentRow.studentName || "—"}</span></div>
                <div>الصف والشعبة: <span className="font-black">{studentRow.grade || "—"} - {studentRow.sectionName || "—"}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1 border-t border-gray-200">
                <div>إجمالي حصص/أيام الغياب: <span className="text-destructive font-black">{studentRow.absentCount || 0} حصة</span></div>
                <div>نسبة الحضور الإجمالية: <span className="text-destructive font-black">{studentRow.attendanceRate || 0}%</span></div>
              </div>
            </div>

            <div className="text-xs leading-relaxed space-y-2 font-medium">
              <p>السلام عليكم ورحمة الله وبركاته،، وبعد:</p>
              <p>
                نود إحاطتكم علماً بأن ابنكم الطالب قد تجاوز الحد المسموح به من الغياب دون عذر مقبول نظاماً، مما يؤثر سلباً على مستواه التحصيلي والدراسي.
              </p>
              <p className="p-3 bg-red-50 border border-red-200 rounded-lg font-bold text-destructive">
                نأمل سرعة مراجعة إدارة المدرسة وتقديم الأعذار المقبولة إن وجدت، لتفادي تطبيق الإجراءات المترتبة على لائحة السلوك والمواظبة الوزارية.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs font-bold border-t border-gray-800">
              <div>
                <p>وكيل شؤون الطلاب</p>
                <p className="mt-8 text-gray-400">........................</p>
              </div>
              <div>
                <p>المرشد الطلابي</p>
                <p className="mt-8 text-gray-400">........................</p>
              </div>
              <div>
                <p>مدير المدرسة والختم</p>
                <div className="h-12 w-12 mx-auto rounded-full border border-dashed border-gray-400 mt-2" />
              </div>
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الحضور والانضباط", to: "/attendance" },
        { label: "تحليلات ومؤشرات الغياب" },
      ]}
    >
      <div className="space-y-6">

        {/* Unified Subnavigation Ribbon */}
        <AttendanceDisciplineNav
          activeTab="reports"
          quickActions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPrintSelectedStudent(null);
                  setIsPrintOpen(true);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-card border border-border/70 px-3.5 text-xs font-bold text-foreground hover:bg-muted transition-all shadow-2xs cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-primary" />
                <span>طباعة التقرير الشامل</span>
              </button>
            </div>
          }
        />

        {/* 4 Interactive KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold">إجمالي الطلاب المشمولين</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {kpiStats.totalStudents.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">طالب</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">مرحلة {getStageLabel(stage)}</div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold">متوسط نسبة الحضور</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {kpiStats.overallRate}%
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">معدل الانضباط التراكمي</div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold">تجاوزوا حد الغياب (إنذار حرج)</span>
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <div className="text-2xl font-black text-destructive tabular-nums">
              {kpiStats.criticalStudents} <span className="text-xs font-bold text-muted-foreground">طالب</span>
            </div>
            <div className="text-[11px] text-destructive/80 font-bold">5 حصص/أيام غياب فأكثر</div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold">إنذارات غياب أولية</span>
              <FileWarning className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {kpiStats.warningStudents} <span className="text-xs font-bold text-muted-foreground">طالب</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">3 إلى 4 أيام غياب مقيدة</div>
          </div>
        </div>

        {/* Dynamic Multi-Filter Ribbon */}
        <div className="bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h3 className="font-black text-xs text-foreground">تصفية وبحث في بيانات الحضور والغياب</h3>
            </div>
            {(searchQ || selectedGrade || selectedSectionId || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearchQ("");
                  setSelectedGrade("");
                  setSelectedSectionId("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-xs text-primary font-bold hover:underline"
              >
                تفريغ الفلاتر
              </button>
            )}
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 text-xs font-bold">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="البحث باسم الطالب أو سجله..."
                className="h-10 w-full rounded-xl border border-input bg-background pr-9 pl-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <select 
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold cursor-pointer outline-none focus:border-primary"
                value={selectedGrade}
                onChange={e => {
                  setSelectedGrade(e.target.value);
                  setSelectedSectionId("");
                }}
              >
                <option value="">جميع الصفوف الدراسية</option>
                {availableGrades.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <select 
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold cursor-pointer outline-none focus:border-primary disabled:opacity-50"
                value={selectedSectionId}
                onChange={e => setSelectedSectionId(e.target.value)}
                disabled={!selectedGrade}
              >
                <option value="">جميع الشُعب</option>
                {filteredSections.map((s) => (
                  <option key={s.id} value={s.id}>شعبة {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <input 
                type="date" 
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary" 
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                title="من تاريخ"
              />
            </div>

            <div>
              <input 
                type="date" 
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary" 
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                title="إلى تاريخ"
              />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Chart 1: Trend Line Chart */}
          <PageCard title="مؤشر نسبة الحضور خلال الأيام الأخيرة" className="lg:col-span-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" textAnchor="end" tick={{ fontSize: 11 }} />
                  <YAxis domain={[80, 100]} stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(val: any) => [`${val}%`, "نسبة الحضور"]}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))', 
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "hsl(var(--primary))" }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </PageCard>

          {/* Chart 2: Status Breakdown Pie Chart */}
          <PageCard title="توزيع حالات الحضور والغياب">
            <div className="h-72 flex flex-col justify-between">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie 
                    data={statusDistribution} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={55} 
                    outerRadius={75} 
                    paddingAngle={4} 
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [val, "عدد الحالات"]}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))', 
                      fontSize: '12px',
                      fontWeight: 'bold' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center pb-2">
                {statusDistribution.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </PageCard>
        </div>

        {/* Section Comparison Chart */}
        <PageCard title="مقارنة معدلات الغياب حسب الشُعب الدراسية">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.6} />
                <XAxis dataKey="section" stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--color-muted-foreground)" tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(val: any) => [val, "إجمالي حصص الغياب"]}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))', 
                    fontSize: '12px',
                    fontWeight: 'bold' 
                  }} 
                />
                <Bar dataKey="absences" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PageCard>

        {/* At-Risk Students & Excessive Absences Section */}
        <PageCard title={`الطلاب المسجل عليهم غياب أو تأخر (${topAbsentStudents.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-foreground font-black">
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3">الصف والشعبة</th>
                  <th className="p-3 text-center">أيام الغياب</th>
                  <th className="p-3 text-center">غياب بعذر</th>
                  <th className="p-3 text-center">التأخير الصباحي</th>
                  <th className="p-3 text-center">نسبة الحضور</th>
                  <th className="p-3 text-center">مستوى الإنذار</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {topAbsentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground font-bold">
                      لا يوجد طلاب عليهم غياب أو تأخير مسجل في هذه الفترة.
                    </td>
                  </tr>
                ) : (
                  topAbsentStudents.map((row) => (
                    <tr key={row.student.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="font-black text-foreground">{row.studentName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">سجل: {row.nationalId}</div>
                      </td>
                      <td className="p-3 font-semibold text-muted-foreground">
                        {row.grade} • شعبة ({row.sectionName})
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-black text-sm tabular-nums ${row.absentCount >= 5 ? "text-destructive" : row.absentCount > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {row.absentCount}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold tabular-nums text-blue-600">
                        {row.excusedCount}
                      </td>
                      <td className="p-3 text-center font-bold tabular-nums text-amber-600">
                        {row.lateCount}
                      </td>
                      <td className="p-3 text-center font-black tabular-nums">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                          row.attendanceRate >= 95 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : row.attendanceRate >= 85
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {row.attendanceRate}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {row.isCritical ? (
                          <Badge tone="danger">إنذار نهائي (تجاوز)</Badge>
                        ) : row.isWarning ? (
                          <Badge tone="warning">إنذار أولي</Badge>
                        ) : (
                          <Badge tone="info">متابعة</Badge>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPrintSelectedStudent(row);
                              setIsPrintOpen(true);
                            }}
                            className="h-8 px-2.5 rounded-xl border border-border/80 bg-background hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1 transition-all"
                            title="طباعة خطاب إنذار رسمي"
                          >
                            <Printer className="w-3.5 h-3.5 text-primary" />
                            <span>إنذار</span>
                          </button>

                          {row.student.guardianPhone && (
                            <a
                              href={`https://wa.me/${row.student.guardianPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`السلام عليكم ورحمة الله، ولي أمر الطالب ${row.studentName}، نود إحاطتكم بتسجيل ${row.absentCount} أيام غياب على الطالب في مدرسة ${systemSettings?.schoolName || "المدرسة"}. نرجو مراجعة الإدارة.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 w-8 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 flex items-center justify-center transition-all"
                              title="إشعار ولي الأمر عبر واتساب"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </PageCard>

      </div>

      {/* Advanced Print Engine */}
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => {
          setIsPrintOpen(false);
          setPrintSelectedStudent(null);
        }} 
        title={`تقرير تحليلات الحضور والغياب - ${getStageLabel(stage)}`}
        data={printSelectedStudent ? [printSelectedStudent] : studentAttendanceSummary}
        templates={printTemplates} 
        defaultTemplateId={printSelectedStudent ? "official-absence-warning" : "attendance-analytics-report"}
      />
    </AppShell>
  );
}
