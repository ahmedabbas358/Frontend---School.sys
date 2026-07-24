import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { DoorOpen, Plus, Trash2, Edit2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/facilities/rooms")({
  head: () => ({ meta: [{ title: "المباني والقاعات الذكية | منصة مدارس" }] }),
  component: RoomsPage,
});

function RoomsPage() {
  const { allRooms, addRoom, updateRoom, deleteRoom, allSections, assignSectionToRoom } = useGlobalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Derive unique buildings from actual room data
  const availableBuildings = useMemo(() => {
    const set = new Set<string>();
    allRooms.forEach(r => { if (r.building) set.add(r.building); });
    return Array.from(set).sort();
  }, [allRooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return allRooms.filter(r => {
      if (filterBuilding !== "all" && r.building !== filterBuilding) return false;
      if (filterType !== "all" && r.type !== filterType) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !r.building.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allRooms, filterBuilding, filterType, filterStatus, searchQ]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    addRoom({
      name: formData.get("name") as string,
      building: formData.get("building") as string,
      floor: formData.get("floor") as string,
      type: formData.get("type") as any,
      capacity: Number(formData.get("capacity")) || 0,
      status: formData.get("status") as any,
    });
    toast.success("تم إضافة القاعة بنجاح");
    setShowAdd(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    const formData = new FormData(e.target as HTMLFormElement);
    updateRoom(editingRoom.id, {
      name: formData.get("name") as string,
      building: formData.get("building") as string,
      floor: formData.get("floor") as string,
      type: formData.get("type") as any,
      capacity: Number(formData.get("capacity")) || 0,
      status: formData.get("status") as any,
    });
    toast.success("تم تحديث بيانات القاعة بنجاح");
    setEditingRoom(null);
  };

  const roomTypeLabel: Record<string, string> = {
    classroom: "فصل دراسي",
    lab: "مختبر",
    office: "مكتب إداري",
    hall: "قاعة عامة / مسرح",
  };

  const RoomFormFields = ({ defaults }: { defaults?: any }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="text-xs font-bold text-muted-foreground mb-1 block">اسم القاعة / الرقم</label>
        <input name="name" defaultValue={defaults?.name} required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="مثال: فصل 1-أ" />
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground mb-1 block">المبنى</label>
        <input name="building" defaultValue={defaults?.building} required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="مثال: المبنى أ" list="buildings-list" />
        {/* Datalist from existing buildings for convenience */}
        <datalist id="buildings-list">
          {availableBuildings.map(b => <option key={b} value={b} />)}
        </datalist>
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground mb-1 block">الدور</label>
        <input name="floor" defaultValue={defaults?.floor} required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="مثال: الأرضي" />
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground mb-1 block">نوع القاعة</label>
        <select name="type" defaultValue={defaults?.type ?? "classroom"} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="classroom">فصل دراسي</option>
          <option value="lab">مختبر</option>
          <option value="office">مكتب إداري</option>
          <option value="hall">قاعة عامة / مسرح</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground mb-1 block">السعة (عدد الأشخاص)</label>
        <input name="capacity" type="number" defaultValue={defaults?.capacity} required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground mb-1 block">الحالة الحالية</label>
        <select name="status" defaultValue={defaults?.status ?? "available"} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <option value="available">متاحة</option>
          <option value="occupied">مشغولة</option>
          <option value="maintenance">تحت الصيانة</option>
        </select>
      </div>
    </div>
  );

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "المرافق والخدمات" }, { label: "المباني الذكية" }]}
      actions={
        <button onClick={() => setShowAdd(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> إضافة قاعة
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <DoorOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">المباني والقاعات (Smart Facilities)</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">إدارة المرافق، الخرائط التفاعلية، وبطاقات التبليغ الذكية</p>
          </div>
        </div>

        {showAdd && (
          <PageCard title="إضافة قاعة جديدة" className="border-primary/20 bg-primary/5 print:hidden">
            <form onSubmit={handleAdd} className="space-y-4">
              <RoomFormFields />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted">إلغاء</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">حفظ القاعة</button>
              </div>
            </form>
          </PageCard>
        )}

        {editingRoom && (
          <PageCard title="تعديل بيانات القاعة" className="border-primary/20 bg-primary/5 print:hidden">
            <form onSubmit={handleEdit} className="space-y-4">
              <RoomFormFields defaults={editingRoom} />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditingRoom(null)} className="px-4 py-2 text-sm font-bold text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted">إلغاء</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">تحديث القاعة</button>
              </div>
            </form>
          </PageCard>
        )}

        {/* Dynamic Filters */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm print:hidden">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="البحث باسم القاعة أو المبنى..."
                className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            {/* Filter by Building — dynamic from data */}
            <select
              value={filterBuilding}
              onChange={e => setFilterBuilding(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="all">كل المباني</option>
              {availableBuildings.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {/* Filter by Type */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="all">كل الأنواع</option>
              <option value="classroom">فصل دراسي</option>
              <option value="lab">مختبر</option>
              <option value="office">مكتب إداري</option>
              <option value="hall">قاعة عامة / مسرح</option>
            </select>
            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="all">كل الحالات</option>
              <option value="available">متاحة</option>
              <option value="occupied">مشغولة</option>
              <option value="maintenance">تحت الصيانة</option>
            </select>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            عرض <span className="font-bold text-foreground">{filteredRooms.length}</span> من أصل <span className="font-bold">{allRooms.length}</span> قاعة
          </p>
        </div>

        <PageCard className="print:hidden animate-in fade-in">
          <DataTable
            rows={filteredRooms}
            columns={[
              { key: "id", header: "الرمز", cell: (r) => <span className="text-xs font-bold text-muted-foreground">{r.id}</span> },
              { key: "name", header: "القاعة", cell: (r) => <div className="font-bold">{r.name}</div> },
              { key: "building", header: "المبنى", cell: (r) => <Badge>{r.building}</Badge> },
              { key: "location", header: "الدور", cell: (r) => `الدور ${r.floor}` },
              { key: "type", header: "النوع", cell: (r) => (
                <span className="text-sm">{roomTypeLabel[r.type] ?? r.type}</span>
              )},
              { key: "capacity", header: "السعة", cell: (r) => `${r.capacity} شخص` },
              { key: "section", header: "الشعبة الدراسية المخصصة", cell: (r) => (
                <select
                  value={r.assignedSectionId || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      assignSectionToRoom(e.target.value, r.id);
                      toast.success(`تم ربط القاعة بالشعبة بنجاح`);
                    } else if (r.assignedSectionId) {
                      assignSectionToRoom(r.assignedSectionId, undefined);
                      toast.success(`تم إلغاء ربط القاعة`);
                    }
                  }}
                  className="text-xs font-bold bg-card border border-border rounded-lg px-2.5 py-1 text-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">-- بدون شعبة مخصصة --</option>
                  {allSections.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.grade} - شعبة {s.name}
                    </option>
                  ))}
                </select>
              )},
              { key: "status", header: "الحالة", cell: (r) => (
                <Badge tone={r.status === "available" ? "success" : r.status === "maintenance" ? "danger" : "warning"}>
                  {r.status === "available" ? "متاحة" : r.status === "maintenance" ? "تحت الصيانة" : "مشغولة"}
                </Badge>
              )},
              { key: "actions", header: "", cell: (r) => (
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingRoom(r)} className="rounded-md p-2 text-primary hover:bg-primary/10 transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => { if(confirm('هل أنت متأكد من الحذف؟')) deleteRoom(r.id); }} className="rounded-md p-2 text-danger hover:bg-danger/10 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            ]}
            empty="لا توجد قاعات مطابقة للفلاتر المحددة"
          />
        </PageCard>
      </div>
    </AppShell>
  );
}
