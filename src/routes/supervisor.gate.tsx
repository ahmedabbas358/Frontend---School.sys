import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import {
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  QrCode,
  Sparkles,
  LogOut,
  LogIn,
  Filter,
  Check,
  Building2,
  Truck,
  Wrench,
  Shield,
  Coffee,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Volume2
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/supervisor/gate")({
  component: SupervisorGateAttendance,
});

type DepartmentFilter = "all" | "cleaning" | "security" | "maintenance" | "transport" | "office";

export function SupervisorGateAttendance() {
  const { allStaff, allStaffAttendance, quickCheckInStaff } = useGlobalStore();

  const [currentGate, setCurrentGate] = useState("البوابة الرئيسية");
  const [gateSupervisor, setGateSupervisor] = useState("مشرف البوابة العامة");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<DepartmentFilter>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "in" | "out" | "absent" | "late">("all");

  // Live real-time clock
  const [currentTime, setCurrentTime] = useState(() => new Date().toTimeString().slice(0, 8));
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Quick sound/visual feedback on check-in
  const [lastCheckInWorker, setLastCheckInWorker] = useState<string | null>(null);

  // Filter staff to include workers & service personnel primarily, plus all staff
  const staffList = useMemo(() => {
    return allStaff
      .filter((s) => !s.isDeleted && s.status !== "terminated")
      .map((s) => {
        const attendance = allStaffAttendance.find(
          (a) => a.staffId === s.id && a.date === todayDate
        );

        let state: "not_arrived" | "checked_in" | "checked_out" | "late" = "not_arrived";
        if (attendance) {
          if (attendance.checkOut) {
            state = "checked_out";
          } else if (attendance.checkIn) {
            state = attendance.status === "late" ? "late" : "checked_in";
          }
        }

        return {
          ...s,
          attendanceRecord: attendance,
          gateState: state,
        };
      });
  }, [allStaff, allStaffAttendance, todayDate]);

  // Department tabs & counts
  const departmentGroups = useMemo(() => {
    return {
      all: staffList,
      cleaning: staffList.filter(
        (s) =>
          s.department.includes("نظافة") ||
          s.department.includes("الصيانة") ||
          s.role.includes("نظافة") ||
          s.role.includes("ضيافة") ||
          s.role.includes("خدمات")
      ),
      security: staffList.filter(
        (s) =>
          s.department.includes("الأمن") ||
          s.role.includes("حارس") ||
          s.role.includes("أمن")
      ),
      maintenance: staffList.filter(
        (s) =>
          s.department.includes("الصيانة") ||
          s.role.includes("صيانة") ||
          s.role.includes("فني") ||
          s.role.includes("ميكانيكي")
      ),
      transport: staffList.filter(
        (s) =>
          s.department.includes("النقل") ||
          s.role.includes("سائق") ||
          s.role.includes("حافلة") ||
          s.role.includes("توصيل")
      ),
      office: staffList.filter(
        (s) =>
          !s.role.includes("نظافة") &&
          !s.role.includes("حارس") &&
          !s.role.includes("صيانة") &&
          !s.role.includes("سائق")
      ),
    };
  }, [staffList]);

  // Filtered workers list
  const filteredList = useMemo(() => {
    const list = departmentGroups[selectedDept] || staffList;

    return list.filter((worker) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        worker.name.toLowerCase().includes(q) ||
        (worker.employeeNo && worker.employeeNo.toLowerCase().includes(q)) ||
        (worker.nationalId && worker.nationalId.includes(q)) ||
        worker.role.toLowerCase().includes(q) ||
        worker.department.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterStatus === "in") return worker.gateState === "checked_in" || worker.gateState === "late";
      if (filterStatus === "out") return worker.gateState === "checked_out";
      if (filterStatus === "absent") return worker.gateState === "not_arrived";
      if (filterStatus === "late") return worker.gateState === "late";

      return true;
    });
  }, [departmentGroups, selectedDept, staffList, searchQuery, filterStatus]);

  // Overall Gate Summary
  const gateStats = useMemo(() => {
    let inside = 0;
    let checkedOut = 0;
    let late = 0;
    let notArrived = 0;

    const base = departmentGroups[selectedDept] || staffList;
    base.forEach((w) => {
      if (w.gateState === "checked_in") inside++;
      else if (w.gateState === "late") {
        inside++;
        late++;
      } else if (w.gateState === "checked_out") checkedOut++;
      else notArrived++;
    });

    return {
      total: base.length,
      inside,
      late,
      checkedOut,
      notArrived,
    };
  }, [departmentGroups, selectedDept, staffList]);

  // Action handlers
  const handleCheckIn = (staffId: string, workerName: string) => {
    const rec = quickCheckInStaff({
      staffId,
      date: todayDate,
      action: "check_in",
      time: currentTime,
      gateSupervisor,
    });

    setLastCheckInWorker(workerName);
    setTimeout(() => setLastCheckInWorker(null), 3000);

    if (rec.status === "late") {
      toast.warning(`تم تسجيل دخول متأخر: ${workerName}`, {
        description: `الساعة: ${currentTime} | تأخير: ${rec.minutesLate || 0} دقيقة`,
      });
    } else {
      toast.success(`تم تسجيل دخول: ${workerName}`, {
        description: `الساعة: ${currentTime} بانتظام عبر ${currentGate}`,
      });
    }
  };

  const handleCheckOut = (staffId: string, workerName: string) => {
    quickCheckInStaff({
      staffId,
      date: todayDate,
      action: "check_out",
      time: currentTime,
      gateSupervisor,
    });

    setLastCheckInWorker(workerName);
    setTimeout(() => setLastCheckInWorker(null), 3000);

    toast.info(`تم تسجيل انصراف: ${workerName}`, {
      description: `الساعة: ${currentTime} عبر ${currentGate}`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-32 font-sans antialiased" dir="rtl">
      {/* Top Header — Natural scrolling */}
      <header className="relative z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              to="/supervisor"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="العودة لبوابة المشرفين"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <Shield className="w-3 h-3" />
                  حراسة واستقبال
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {currentGate}
                </span>
              </div>
              <h1 className="text-base font-bold tracking-tight">
                بوابة تحضير العمال والكادر
              </h1>
            </div>
          </div>

          {/* Real-time Clock Banner */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-mono text-xs font-bold shadow-xs">
              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>{currentTime}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">{todayDate}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Gate & Supervisor Config Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                موقع البوابة
              </label>
              <select
                value={currentGate}
                onChange={(e) => setCurrentGate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="البوابة الرئيسية">البوابة الرئيسية (الاستقبال)</option>
                <option value="بوابة الخدمات والصيانة">بوابة الخدمات والصيانة</option>
                <option value="بوابة الحافلات والنقل">بوابة الحافلات والنقل</option>
                <option value="بوابة الحركة والتموين">بوابة الحركة والتموين</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                المشرف المناوب
              </label>
              <input
                type="text"
                value={gateSupervisor}
                onChange={(e) => setGateSupervisor(e.target.value)}
                placeholder="اسم مشرف البوابة"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Gatehead Metrics */}
        <div className="grid grid-cols-4 gap-2">
          <div
            onClick={() => setFilterStatus(filterStatus === "in" ? "all" : "in")}
            className={`cursor-pointer border rounded-2xl p-2.5 text-center transition-all ${
              filterStatus === "in"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60"
            }`}
          >
            <span className={`block text-[11px] font-bold mb-0.5 ${filterStatus === "in" ? "text-white" : "text-emerald-700 dark:text-emerald-300"}`}>
              داخل المدرسة
            </span>
            <span className={`text-lg font-extrabold leading-none ${filterStatus === "in" ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`}>
              {gateStats.inside}
            </span>
          </div>

          <div
            onClick={() => setFilterStatus(filterStatus === "late" ? "all" : "late")}
            className={`cursor-pointer border rounded-2xl p-2.5 text-center transition-all ${
              filterStatus === "late"
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60"
            }`}
          >
            <span className={`block text-[11px] font-bold mb-0.5 ${filterStatus === "late" ? "text-white" : "text-amber-700 dark:text-amber-300"}`}>
              متأخرون
            </span>
            <span className={`text-lg font-extrabold leading-none ${filterStatus === "late" ? "text-white" : "text-amber-600 dark:text-amber-400"}`}>
              {gateStats.late}
            </span>
          </div>

          <div
            onClick={() => setFilterStatus(filterStatus === "out" ? "all" : "out")}
            className={`cursor-pointer border rounded-2xl p-2.5 text-center transition-all ${
              filterStatus === "out"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60"
            }`}
          >
            <span className={`block text-[11px] font-bold mb-0.5 ${filterStatus === "out" ? "text-white" : "text-blue-700 dark:text-blue-300"}`}>
              انصرفوا
            </span>
            <span className={`text-lg font-extrabold leading-none ${filterStatus === "out" ? "text-white" : "text-blue-600 dark:text-blue-400"}`}>
              {gateStats.checkedOut}
            </span>
          </div>

          <div
            onClick={() => setFilterStatus(filterStatus === "absent" ? "all" : "absent")}
            className={`cursor-pointer border rounded-2xl p-2.5 text-center transition-all ${
              filterStatus === "absent"
                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60"
            }`}
          >
            <span className={`block text-[11px] font-bold mb-0.5 ${filterStatus === "absent" ? "text-white" : "text-rose-700 dark:text-rose-300"}`}>
              لم يحضروا
            </span>
            <span className={`text-lg font-extrabold leading-none ${filterStatus === "absent" ? "text-white" : "text-rose-600 dark:text-rose-400"}`}>
              {gateStats.notArrived}
            </span>
          </div>
        </div>

        {/* Category / Department Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all" as DepartmentFilter, label: "الكل", count: departmentGroups.all.length, icon: Building2 },
            { id: "cleaning" as DepartmentFilter, label: "النظافة والخدمات", count: departmentGroups.cleaning.length, icon: Coffee },
            { id: "security" as DepartmentFilter, label: "الأمن والسلامة", count: departmentGroups.security.length, icon: Shield },
            { id: "maintenance" as DepartmentFilter, label: "الصيانة والتشغيل", count: departmentGroups.maintenance.length, icon: Wrench },
            { id: "transport" as DepartmentFilter, label: "السائقين والنقل", count: departmentGroups.transport.length, icon: Truck },
            { id: "office" as DepartmentFilter, label: "الإداريين والتعليمي", count: departmentGroups.office.length, icon: Users },
          ].map((dept) => {
            const Icon = dept.icon;
            const isSelected = selectedDept === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={`whitespace-nowrap px-3 py-2 rounded-2xl font-bold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs scale-[1.02]"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{dept.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 dark:bg-slate-900/20" : "bg-slate-100 dark:bg-slate-800"}`}>
                  {dept.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Fast Scan Bar */}
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الوظيفة، أو رقم الموظف..."
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pr-9 pl-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={() => toast.info("قارئ الباركود اللاسلكي متصل وجاهز للاستقبال تلقائياً")}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="فحص الباركود أو بطاقة الموظف"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>

        {/* Workers List */}
        <div className="space-y-2.5">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
              <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لا يوجد موظفون مطابقون
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تأكد من اختيار القسم أو مسح نص البحث
              </p>
            </div>
          ) : (
            filteredList.map((worker) => {
              const rec = worker.attendanceRecord;
              const isJustChecked = lastCheckInWorker === worker.name;

              return (
                <div
                  key={worker.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-3.5 border transition-all ${
                    isJustChecked
                      ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20"
                      : "border-slate-200 dark:border-slate-800 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                        {worker.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                            {worker.name}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {worker.employeeNo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-primary">{worker.role}</span>
                          <span>•</span>
                          <span>{worker.department}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="text-left shrink-0">
                      {worker.gateState === "checked_in" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          داخل المدرسة ({rec?.checkIn?.slice(0, 5)})
                        </span>
                      )}
                      {worker.gateState === "late" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          متأخر ({rec?.minutesLate} د)
                        </span>
                      )}
                      {worker.gateState === "checked_out" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          <LogOut className="w-3 h-3" />
                          انصرف ({rec?.checkOut?.slice(0, 5)})
                        </span>
                      )}
                      {worker.gateState === "not_arrived" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          لم يحضر بعد
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1-Tap Fast Check-in & Check-out Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleCheckIn(worker.id, worker.name)}
                      className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                        worker.gateState === "checked_in" || worker.gateState === "late"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20"
                          : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{worker.gateState === "checked_in" || worker.gateState === "late" ? "تم تسجيل الدخول" : "تسجيل دخول الآن"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCheckOut(worker.id, worker.name)}
                      className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                        worker.gateState === "checked_out"
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{worker.gateState === "checked_out" ? "تم تسجيل الانصراف" : "تسجيل انصراف"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              المزامنة المركزية مع شؤون الموظفين نشطة
            </span>
          </div>

          <Link
            to="/supervisor"
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs hover:opacity-90 transition-opacity"
          >
            بوابة المشرفين
          </Link>
        </div>
      </footer>
    </div>
  );
}
