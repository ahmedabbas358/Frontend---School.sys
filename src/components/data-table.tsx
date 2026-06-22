/* DataTable — generic responsive table used across modules */
import type { ReactNode } from "react";

export interface DTColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty,
  onRowClick,
}: {
  columns: DTColumn<T>[];
  rows: T[];
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
}) {
  if (rows.length === 0)
    return <div className="px-6 py-12 text-center text-sm text-muted-foreground">{empty ?? "لا توجد بيانات"}</div>;
  
  return (
    <div className="overflow-x-auto rounded-xl border border-border/50 bg-card">
      <table className="w-full min-w-[640px] text-right text-sm tabular">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider backdrop-blur-md">
            {columns.map((c) => (
              <th key={c.key} className={`px-6 py-4 ${c.className ?? ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors duration-200 hover:bg-accent/40 ${
                onRowClick ? "cursor-pointer" : ""
              } bg-transparent`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-6 py-4 align-middle ${c.className ?? ""}`}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
