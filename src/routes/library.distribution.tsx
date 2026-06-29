import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { BookOpen, Search, Check, X, AlertCircle, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { toast } from "sonner";

export const Route = createFileRoute("/library/distribution")({
  component: LibraryDistribution,
});

function LibraryDistribution() {
  const { activeStageStudents, activeStageTextbooks, activeStageDistributions, distributeTextbook, removeDistribution, allSections } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [q, setQ] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const grades = useMemo(() => getGradesForStage(stage), [stage]);

  const getRequiredBooks = (student: any) => activeStageTextbooks.filter(tb => tb.gradeId === student.grade);
  const getReceivedBooks = (student: any) => activeStageDistributions.filter(d => d.studentId === student.id);
  const getProgress = (student: any) => {
    const required = getRequiredBooks(student).length;
    const received = getReceivedBooks(student).filter(distribution => getRequiredBooks(student).some(book => book.id === distribution.textbookId)).length;
    const percentage = required > 0 ? Math.round((received / required) * 100) : 0;
    const status = required === 0 ? "none" : received >= required ? "complete" : received > 0 ? "partial" : "missing";
    return { required, received, percentage, status };
  };

  const filteredStudents = useMemo(() => {
    return activeStageStudents.filter((s) => {
      if (filterGrade !== "all" && s.grade !== filterGrade) return false;
      if (filterSection !== "all" && s.sectionId !== filterSection) return false;
      const progress = getProgress(s);
      if (filterStatus !== "all" && progress.status !== filterStatus) return false;
      if (q && !s.name.includes(q) && !s.id.includes(q) && !s.guardianName.includes(q)) return false;
      return true;
    });
  }, [q, filterGrade, filterSection, filterStatus, activeStageStudents, activeStageTextbooks, activeStageDistributions]);

  const stats = useMemo(() => {
    const rows = activeStageStudents.map(getProgress);
    return {
      total: rows.length,
      complete: rows.filter(item => item.status === "complete").length,
      partial: rows.filter(item => item.status === "partial").length,
      missing: rows.filter(item => item.status === "missing").length,
      requiredCopies: activeStageTextbooks.reduce((sum, book) => sum + book.copies, 0),
      distributedCopies: activeStageDistributions.length,
    };
  }, [activeStageStudents, activeStageTextbooks, activeStageDistributions]);

  const handleToggleTextbook = (textbook: any, action: 'give' | 'return', distributionId?: string) => {
    if (action === 'return' && distributionId) {
      if (confirm(`هل أنت متأكد من إرجاع كتاب "${textbook.title}" إلى المخزن؟`)) {
        removeDistribution(distributionId);
        toast.success(`تم استرجاع "${textbook.title}" إلى المخزن`);
      }
    } else if (action === 'give') {
      // Check availability
      const distributedCount = activeStageDistributions.filter(d => d.textbookId === textbook.id).length;
      const available = textbook.copies - distributedCount;
      if (available <= 0) {
        toast.error(`لا توجد نسخ متاحة في المخزن من كتاب "${textbook.title}"`);
        return;
      }
      distributeTextbook({
        studentId: selectedStudent.id,
        textbookId: textbook.id,
        stage
      });
      toast.success(`تم تسليم "${textbook.title}" للطالب`);
    }
  };

  const deliverAllMissing = () => {
    if (!selectedStudent) return;
    const missingBooks = studentTextbooks.filter(book => !activeStageDistributions.some(d => d.studentId === selectedStudent.id && d.textbookId === book.id));
    let delivered = 0;
    for (const book of missingBooks) {
      const distributedCount = activeStageDistributions.filter(d => d.textbookId === book.id).length + delivered;
      if (book.copies - distributedCount <= 0) continue;
      distributeTextbook({ studentId: selectedStudent.id, textbookId: book.id, stage });
      delivered++;
    }
    toast.success(`تم تسليم ${delivered} كتاب للطالب`);
  };

  const returnAllReceived = () => {
    if (!selectedStudent) return;
    const received = activeStageDistributions.filter(d => d.studentId === selectedStudent.id);
    received.forEach(item => removeDistribution(item.id));
    toast.success(`تم استرجاع ${received.length} كتاب إلى المخزن`);
  };

  const studentTextbooks = useMemo(() => {
    if (!selectedStudent) return [];
    return activeStageTextbooks.filter(tb => tb.gradeId === selectedStudent.grade);
  }, [selectedStudent, activeStageTextbooks]);

  const groupedTextbooks = useMemo(() => {
    const groups: Record<string, typeof studentTextbooks> = {};
    studentTextbooks.forEach(tb => {
      const term = tb.term || "الفصل الأول";
      if (!groups[term]) groups[term] = [];
      groups[term].push(tb);
    });
    return groups;
  }, [studentTextbooks]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المرافق والخدمات" },
        { label: "توزيع الكتب" },
      ]}
    >
      <div className="space-y-4">
        
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">توزيع الكتب: {selectedStudent.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStudent.grade} / ولي الأمر: {selectedStudent.guardianName}</p>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-accent rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="mb-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/50 bg-background p-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground">المطلوب</p>
                    <p className="text-2xl font-black">{studentTextbooks.length}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background p-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground">المستلم</p>
                    <p className="text-2xl font-black text-success">{getProgress(selectedStudent).received}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background p-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground">المتبقي</p>
                    <p className="text-2xl font-black text-danger">{Math.max(0, studentTextbooks.length - getProgress(selectedStudent).received)}</p>
                  </div>
                </div>
                <div className="mb-5 flex flex-wrap gap-2">
                  <button onClick={deliverAllMissing} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">تسليم كل المتبقي</button>
                  <button onClick={returnAllReceived} className="rounded-xl border border-danger/30 px-4 py-2 text-sm font-bold text-danger hover:bg-danger/10">استرجاع كل المستلم</button>
                </div>
                {studentTextbooks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>لم يتم تعيين كتب دراسية لهذا الصف بعد.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedTextbooks).sort(([a], [b]) => a.localeCompare(b)).map(([term, books]) => (
                      <div key={term} className="space-y-3">
                        <h4 className="font-bold text-primary border-b border-border pb-2">{term}</h4>
                        {books.map(tb => {
                          const distributions = activeStageDistributions.filter(
                            d => d.studentId === selectedStudent.id && d.textbookId === tb.id
                          );
                          const receivedCount = distributions.length;
                          const lastDistribution = distributions[distributions.length - 1];
                          const totalDistributed = activeStageDistributions.filter(d => d.textbookId === tb.id).length;
                          const available = tb.copies - totalDistributed;

                          return (
                            <div key={tb.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                              <div>
                                <h4 className="font-bold">{tb.title}</h4>
                                <p className="text-sm text-muted-foreground">{tb.subject} | متبقي في المخزن: <span className="font-bold">{available}</span> من أصل {tb.copies}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                {receivedCount > 0 && (
                                  <span className="text-sm font-bold bg-success/10 text-success px-2 py-1 rounded flex items-center gap-1"><Check className="h-3 w-3" /> مستلم</span>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleToggleTextbook(tb, 'return', lastDistribution?.id)}
                                    disabled={receivedCount === 0}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-colors border ${
                                      receivedCount > 0
                                        ? "border-danger text-danger hover:bg-danger/10"
                                        : "border-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    }`}
                                  >
                                    إرجاع
                                  </button>
                                  <button
                                    onClick={() => handleToggleTextbook(tb, 'give')}
                                    disabled={available <= 0}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-colors ${
                                      available > 0 
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "bg-muted text-muted-foreground cursor-not-allowed"
                                    }`}
                                  >
                                    تسليم
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">إجمالي الطلاب</p>
            <p className="mt-1 text-2xl font-black">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">مكتمل التسليم</p>
            <p className="mt-1 text-2xl font-black text-success">{stats.complete}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">تسليم جزئي</p>
            <p className="mt-1 text-2xl font-black text-warning">{stats.partial}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">نسخ موزعة / مخزون</p>
            <p className="mt-1 text-2xl font-black text-primary">{stats.distributedCopies} / {stats.requiredCopies}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">فلاتر التسليم</span>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_170px_170px_170px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث عن طالب أو ولي أمر..."
                className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="all">كل الصفوف</option>
              {grades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="all">كل الشعب</option>
              {allSections.filter(s => s.stage === stage && (filterGrade === "all" || s.grade === filterGrade)).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="all">كل الحالات</option>
              <option value="complete">مكتمل</option>
              <option value="partial">جزئي</option>
              <option value="missing">لم يستلم</option>
              <option value="none">لا توجد كتب</option>
            </select>
          </div>
        </div>

        <PageCard>
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">توزيع وتسليم الكتب ({getStageLabel(stage)})</h2>
          </div>
          <DataTable
            rows={filteredStudents}
            columns={[
              { key: "name", header: "اسم الطالب", cell: (r) => <span className="font-bold">{r.name}</span> },
              { key: "guardian", header: "ولي الأمر", cell: (r) => <span className="text-sm text-muted-foreground">{r.guardianName}</span> },
              { key: "grade", header: "الفصل", cell: (r) => r.grade },
              { key: "section", header: "الشعبة", cell: (r) => { const sec = allSections.find(s => s.id === r.sectionId); return sec ? sec.name : "-"; } },
              {
                key: "progress",
                header: "الكتب المستلمة",
                cell: (r) => {
                  const { required: requiredBooks, received: receivedBooks, percentage, status } = getProgress(r);
                  
                  if (requiredBooks === 0) return <span className="text-muted-foreground text-sm">لا توجد كتب</span>;
                  
                  const isComplete = status === "complete";
                  return (
                    <div className="flex flex-col gap-1 w-32">
                      <div className="flex justify-between text-xs">
                        <span>{receivedBooks} من {requiredBooks}</span>
                        <span className="font-bold">{percentage}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div 
                          className={`h-full ${isComplete ? 'bg-success' : 'bg-primary'}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "actions",
                header: "",
                cell: (r) => (
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setSelectedStudent(r)} 
                      className="px-3 py-1.5 text-sm bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      إدارة الكتب
                    </button>
                  </div>
                ),
              },
            ]}
            empty="لا يوجد طلاب مطابقين للبحث."
          />
        </PageCard>
      </div>
    </AppShell>
  );
}
