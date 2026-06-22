import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { DoorOpen, Plus, Settings, Map as MapIcon, QrCode, LayoutList, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

export const Route = createFileRoute("/facilities/rooms")({
  head: () => ({ meta: [{ title: "المباني والقاعات الذكية | منصة مدارس" }] }),
  component: RoomsPage,
});

function RoomsPage() {
  const { allRooms, addRoom } = useGlobalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map" | "qr">("list");

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

  const handlePrintQRCodes = () => {
    window.print();
  };

  // Group rooms by floor for map view
  const floors = Array.from(new Set(allRooms.map(r => r.floor)));

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

        <div className="flex bg-muted/30 p-1 rounded-xl w-max border border-border print:hidden">
          <button 
            onClick={() => setViewMode("list")} 
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${viewMode === "list" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutList className="w-4 h-4" /> قائمة القاعات
          </button>
          <button 
            onClick={() => setViewMode("map")} 
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${viewMode === "map" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <MapIcon className="w-4 h-4" /> الخريطة التفاعلية
          </button>
          <button 
            onClick={() => setViewMode("qr")} 
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${viewMode === "qr" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <QrCode className="w-4 h-4" /> ملصقات QR
          </button>
        </div>

        {showAdd && (
          <PageCard title="إضافة قاعة جديدة" className="border-primary/20 bg-primary/5 print:hidden">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">اسم القاعة / الرقم</label>
                  <input name="name" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="مثال: فصل 1-أ" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">المبنى</label>
                  <input name="building" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="مثال: المبنى أ" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">الدور</label>
                  <input name="floor" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="مثال: الأرضي" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">نوع القاعة</label>
                  <select name="type" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                    <option value="classroom">فصل دراسي</option>
                    <option value="lab">مختبر</option>
                    <option value="office">مكتب إداري</option>
                    <option value="hall">قاعة عامة / مسرح</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">السعة (عدد الأشخاص)</label>
                  <input name="capacity" type="number" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">الحالة الحالية</label>
                  <select name="status" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                    <option value="available">متاحة</option>
                    <option value="occupied">مشغولة</option>
                    <option value="maintenance">تحت الصيانة</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted">إلغاء</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">حفظ القاعة</button>
              </div>
            </form>
          </PageCard>
        )}

        {viewMode === "list" && (
          <PageCard className="print:hidden animate-in fade-in">
            <DataTable
              rows={allRooms}
              columns={[
                { key: "id", header: "الرمز", cell: (r) => <span className="text-xs font-bold text-muted-foreground">{r.id}</span> },
                { key: "name", header: "القاعة", cell: (r) => <div className="font-bold">{r.name}</div> },
                { key: "location", header: "الموقع", cell: (r) => `${r.building} - الدور ${r.floor}` },
                { key: "type", header: "النوع", cell: (r) => (
                  <span className="text-sm">
                    {r.type === "classroom" ? "فصل دراسي" : r.type === "lab" ? "مختبر" : r.type === "office" ? "مكتب" : "قاعة عامة"}
                  </span>
                )},
                { key: "capacity", header: "السعة", cell: (r) => `${r.capacity} شخص` },
                { key: "status", header: "الحالة", cell: (r) => (
                  <Badge tone={r.status === "available" ? "success" : r.status === "maintenance" ? "danger" : "warning"}>
                    {r.status === "available" ? "متاحة" : r.status === "maintenance" ? "تحت الصيانة" : "مشغولة"}
                  </Badge>
                )},
                { key: "actions", header: "", cell: () => (
                  <div className="flex justify-end">
                     <button className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                )}
              ]}
              empty="لا توجد قاعات مسجلة"
            />
          </PageCard>
        )}

        {viewMode === "map" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex gap-4 mb-4 text-sm font-bold">
               <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-success/20 border border-success"></div> متاحة</div>
               <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-warning/20 border border-warning"></div> مشغولة</div>
               <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-danger/20 border border-danger animate-pulse"></div> صيانة</div>
            </div>
            {floors.map(floor => (
               <PageCard key={floor} title={`خريطة الدور: ${floor}`}>
                 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-muted/10 rounded-xl border-2 border-dashed border-border">
                   {allRooms.filter(r => r.floor === floor).map(room => (
                      <div 
                        key={room.id} 
                        className={`aspect-square rounded-xl border-2 p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 ${
                          room.status === 'available' ? 'bg-success/5 border-success/30 hover:border-success' :
                          room.status === 'occupied' ? 'bg-warning/5 border-warning/30 hover:border-warning' :
                          'bg-danger/10 border-danger/50 hover:border-danger'
                        }`}
                        onClick={() => toast.info(`قاعة: ${room.name} | السعة: ${room.capacity}`)}
                      >
                         <DoorOpen className={`w-8 h-8 mb-2 ${room.status === 'available' ? 'text-success' : room.status === 'occupied' ? 'text-warning' : 'text-danger'}`} />
                         <span className="font-black text-sm">{room.name}</span>
                         <span className="text-[10px] text-muted-foreground font-bold mt-1">{room.type === 'classroom' ? 'فصل' : room.type === 'lab' ? 'مختبر' : 'مكتب'}</span>
                      </div>
                   ))}
                 </div>
               </PageCard>
            ))}
          </div>
        )}

        {viewMode === "qr" && (
          <div className="space-y-4 animate-in fade-in">
             <div className="flex justify-between items-center print:hidden">
                <p className="text-sm font-bold text-muted-foreground">الصق هذه البطاقات على أبواب القاعات ليتمكن الموظفون من الإبلاغ عن الأعطال سريعاً عبر هواتفهم.</p>
                <button onClick={handlePrintQRCodes} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors">
                  <Printer className="w-4 h-4" /> طباعة البطاقات
                </button>
             </div>
             
             <style>{`
               @media print {
                 @page { size: A4; margin: 10mm; }
                 body { background: white; }
                 .print\\:hidden { display: none !important; }
               }
             `}</style>
             
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
                {allRooms.map(room => (
                   <div key={room.id} className="bg-card border-2 border-border p-4 rounded-xl flex flex-col items-center text-center shadow-sm print:shadow-none print:break-inside-avoid">
                      <div className="w-full flex justify-between items-start mb-4">
                         <div className="bg-primary/10 text-primary p-2 rounded-lg">
                           <DoorOpen className="w-5 h-5" />
                         </div>
                         <div className="text-[10px] font-bold text-muted-foreground border px-2 py-1 rounded">
                           {room.id}
                         </div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-border shadow-sm mb-4 inline-block">
                        <QRCode value={`https://school-system.local/report-issue?roomId=${room.id}`} size={120} />
                      </div>
                      <h3 className="font-black text-lg">{room.name}</h3>
                      <p className="text-xs text-muted-foreground font-bold">{room.building} - الدور {room.floor}</p>
                      <div className="mt-4 pt-3 border-t border-dashed border-border w-full text-[10px] font-bold text-muted-foreground">
                         امسح الرمز للإبلاغ عن عطل
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
