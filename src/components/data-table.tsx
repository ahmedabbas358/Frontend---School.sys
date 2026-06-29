/* DataTable — generic responsive table used across modules */
import { ChevronLeft, ChevronRight, LayoutList } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

export interface DTColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

type DataTableDensity = "compact" | "comfortable";

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty,
  onRowClick,
  pageSize = 50,
  pageSizeOptions = [25, 50, 100, 250],
  paginate,
  density = "comfortable",
  maxHeight,
}: {
  columns: DTColumn<T>[];
  rows: T[];
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  paginate?: boolean;
  density?: DataTableDensity;
  maxHeight?: string;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const shouldPaginate = paginate ?? rows.length > currentPageSize;
  const totalPages = shouldPaginate ? Math.max(1, Math.ceil(rows.length / currentPageSize)) : 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = shouldPaginate ? (safePage - 1) * currentPageSize : 0;
  const visibleRows = useMemo(
    () => shouldPaginate ? rows.slice(startIndex, startIndex + currentPageSize) : rows,
    [currentPageSize, rows, shouldPaginate, startIndex],
  );
  const rowPadding = density === "compact" ? "px-4 py-2.5" : "px-6 py-4";
  const tableMaxHeight = maxHeight ?? (rows.length > 100 ? "70vh" : undefined);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length, currentPageSize]);

  if (rows.length === 0)
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center animate-in fade-in">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-muted/50 mb-4">
          <LayoutList className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <div className="text-sm font-bold text-muted-foreground">{empty ?? "لا توجد بيانات للعرض حالياً"}</div>
      </div>
    );
  
  return (
    <div className="rounded-xl border border-border/50 bg-card">
      <div className="overflow-auto" style={tableMaxHeight ? { maxHeight: tableMaxHeight } : undefined}>
      <table className="w-full min-w-[720px] text-right text-sm tabular">
        <thead>
          <tr className="border-b border-border/50 bg-muted/40 text-xs font-bold text-muted-foreground uppercase backdrop-blur-md sticky top-0 z-10">
            {columns.map((c) => (
              <th key={c.key} className={`${rowPadding} ${c.className ?? ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {visibleRows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={`transition-all duration-200 hover:bg-accent/60 group ${
                onRowClick ? "cursor-pointer hover:shadow-sm" : ""
              } bg-transparent`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`${rowPadding} align-middle ${c.className ?? ""}`}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {shouldPaginate && (
        <div className="flex flex-col gap-3 border-t border-border/50 bg-muted/15 px-4 py-3 text-xs font-bold text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            عرض {startIndex + 1}-{Math.min(startIndex + currentPageSize, rows.length)} من {rows.length.toLocaleString()} سجل
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={currentPageSize}
              onChange={(event) => setCurrentPageSize(Number(event.target.value))}
              className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-bold text-foreground"
              aria-label="عدد السجلات في الصفحة"
            >
              {pageSizeOptions.map(size => <option key={size} value={size}>{size} / صفحة</option>)}
            </select>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={safePage === 1}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="الصفحة السابقة"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="min-w-20 text-center text-foreground">صفحة {safePage} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={safePage === totalPages}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="الصفحة التالية"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
