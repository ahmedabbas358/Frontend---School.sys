import React, { useState, useEffect, useMemo } from "react";
import { Printer, X, LayoutTemplate, Download, Edit3, Settings2, FileText, Image, LayoutGrid, Award, QrCode, CheckSquare, Square, ChevronDown, ChevronUp, Users, Filter, FileSpreadsheet, Code, Database } from "lucide-react";
import QRCode from "react-qr-code";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

export type PrintOptions = {
  hiddenColumns: Record<string, boolean>;
  fontSize: "xs" | "sm" | "base" | "lg" | "xl";
  stripeRows: boolean;
  extraEmptyRows: number;
  showHeader: boolean;
  showSignatures: boolean;
  customNote: string;
  customOptions: Record<string, any>;
  themePreset: "modern" | "classic" | "elegant" | "dark";
};

export type TableColumn = {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
};

export type PrintTemplate = {
  id: string;
  name: string;
  category: string;
  description?: string;
  type: "table" | "document" | "cards" | "certificate" | "receipt";
  columns?: TableColumn[];
  extraDynamicColumns?: number; 
  extraDynamicColumnLabel?: string;
  renderDocument?: (options: PrintOptions, data: any[]) => React.ReactNode;
  customControls?: {
    key: string;
    label: string;
    type: "toggle" | "select" | "number" | "text";
    options?: { label: string; value: any }[];
    defaultValue: any;
  }[];
};

interface AdvancedPrintEngineProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  data?: any[];
  templates: PrintTemplate[];
  defaultTemplateId?: string;
}

function Accordion({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 transition-colors text-right"
      >
        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="p-3 bg-background space-y-4 animate-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

// Helper for Content Editable
function EditableText({ value, onChange, className, style, tagName: Tag = "div" }: any) {
  const isReactElement = React.isValidElement(value);

  if (isReactElement) {
    return (
      <Tag className={`outline-none block w-full leading-relaxed ${className}`} style={{ lineHeight: "1.6", wordBreak: "break-word", overflowWrap: "break-word", ...style }}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: any) => onChange && onChange(e.target.innerText)}
      className={`outline-none focus:ring-2 focus:ring-primary/50 focus:bg-primary/5 rounded transition-all cursor-text block leading-relaxed ${className}`}
      style={{ lineHeight: "1.6", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "normal", ...style }}
      dangerouslySetInnerHTML={{ __html: String(value ?? "") }}
    />
  );
}

export function AdvancedPrintEngine({
  isOpen, onClose, title = "تقرير مخصص", subtitle, data = [], templates, defaultTemplateId
}: AdvancedPrintEngineProps) {
  
  const globalStore = useGlobalStore();
  
  // Basic State
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplateId || templates[0]?.id || "");
  const [editMode, setEditMode] = useState(true); // Default to true for V4
  
  // Custom text states that overrides default props
  const [customTitle, setCustomTitle] = useState(title);
  const [customSubtitle, setCustomSubtitle] = useState(subtitle || "");
  const [customNote, setCustomNote] = useState("");
  const [customOptions, setCustomOptions] = useState<Record<string, any>>({});
  
  // Column overrides (for headers)
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({});
  

  // Data Filtering
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set());
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [qrType, setQrType] = useState<"url" | "data" | "id">("url");

  // V5: Auto-Enrichment
  const enrichedData = useMemo(() => {
    return data.map(row => {
      let enriched = { ...row };
      if (row.studentId) {
         const s = globalStore.activeStageStudents.find(st => st.id === row.studentId);
         if (s) {
           if (!enriched.grade) enriched.grade = s.grade;
           if (!enriched.sectionId) enriched.sectionId = s.sectionId;
           if (!enriched.studentName) enriched.studentName = s.name;
         }
      }
      return enriched;
    });
  }, [data, globalStore.activeStageStudents]);

  const availableGrades = useMemo(() => Array.from(new Set(enrichedData.map(d => d.grade as string).filter(Boolean))), [enrichedData]);
  const availableSections = useMemo(() => Array.from(new Set(enrichedData.map(d => d.sectionId as string).filter(Boolean))), [enrichedData]);

  // Sync rows initially or reset on close
  useEffect(() => {
    if (isOpen) {
      if (enrichedData.length > 0 && selectedRowIds.size === 0) {
        setSelectedRowIds(new Set(enrichedData.map((d: any, i: number) => d.id || String(i))));
        setSelectedGrades(new Set(availableGrades));
        setSelectedSections(new Set(availableSections));
      }
    } else {
      // Reset when closed so it re-initializes next time
      setSelectedRowIds(new Set());
      setSelectedGrades(new Set());
      setSelectedSections(new Set());
    }
  }, [isOpen, enrichedData, availableGrades, availableSections, selectedRowIds.size]);

  const filteredData = useMemo(() => {
    return enrichedData.filter((row: any, i: number) => {
      const id = row.id || String(i);
      if (!selectedRowIds.has(id)) return false;
      
      // V5: Matrix Filters
      if (row.grade && !selectedGrades.has(row.grade)) return false;
      if (row.sectionId && !selectedSections.has(row.sectionId)) return false;

      if (filterText) {
        const searchStr = Object.values(row).join(" ").toLowerCase();
        if (!searchStr.includes(filterText.toLowerCase())) return false;
      }
      return true;
    });
  }, [enrichedData, selectedRowIds, filterText, selectedGrades, selectedSections]);

  // Page Settings
  const [paperOrientation, setPaperOrientation] = useState<"portrait" | "landscape">("portrait");
  const [marginSize, setMarginSize] = useState<"none" | "sm" | "md" | "lg">("md");
  const [printBackgrounds, setPrintBackgrounds] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [pageFrame, setPageFrame] = useState(false);
  const [pageFrameStyle, setPageFrameStyle] = useState<"solid" | "double" | "dashed">("solid");

  // Table Formatting
  const [themePreset, setThemePreset] = useState<"modern" | "classic" | "elegant" | "dark">("modern");
  const [tableBorderStyle, setTableBorderStyle] = useState<"none" | "solid" | "dashed" | "dotted" | "double">("solid");
  const [tableBorderWidth, setTableBorderWidth] = useState<"1px" | "2px" | "3px">("1px");
  const [tableBorderColor, setTableBorderColor] = useState("#e5e7eb");
  const [headerBackgroundColor, setHeaderBackgroundColor] = useState("#f3f4f6");
  const [headerTextColor, setHeaderTextColor] = useState("#111827");
  const [stripeColor, setStripeColor] = useState("#f8fafc");
  const [extraEmptyRows, setExtraEmptyRows] = useState(0);

  // Typography & Alignment
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono" | "cairo">("sans");
  const [dataFontSize, setDataFontSize] = useState<"xs" | "sm" | "base" | "lg" | "xl">("sm");
  const [textColor, setTextColor] = useState("#000000");
  const [titleColor, setTitleColor] = useState("#000000");

  // Content Controls
  const [showHeader, setShowHeader] = useState(true);
  const [headerStyle, setHeaderStyle] = useState<"modern" | "classic" | "minimal">("classic");
  const [showSignatures, setShowSignatures] = useState(true);
  const [sig1Label, setSig1Label] = useState("الاسم المعتمد");
  const [sig2Label, setSig2Label] = useState("المراجعة والتدقيق");
  const [sig3Label, setSig3Label] = useState("مدير المدرسة");
  
  // Advanced
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("https://school-system.local/verify");

  // Performance and Print
  const [previewLimit, setPreviewLimit] = useState(50);
  const [showAllForPrint, setShowAllForPrint] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const currentTemplateObj = templates.find(t => t.id === selectedTemplate) || templates[0];

  // Apply Theme Presets
  useEffect(() => {
    if (themePreset === "classic") {
      setFontFamily("serif");
      setHeaderBackgroundColor("#ffffff");
      setHeaderTextColor("#000000");
      setTableBorderStyle("solid");
      setTableBorderColor("#000000");
      setHeaderStyle("classic");
      setStripeColor("#f9fafb");
    } else if (themePreset === "modern") {
      setFontFamily("sans");
      setHeaderBackgroundColor("#f3f4f6");
      setHeaderTextColor("#111827");
      setTableBorderStyle("solid");
      setTableBorderColor("#e5e7eb");
      setHeaderStyle("modern");
      setStripeColor("#f8fafc");
    } else if (themePreset === "elegant") {
      setFontFamily("cairo");
      setHeaderBackgroundColor("#fdfbf7");
      setHeaderTextColor("#4338ca");
      setTableBorderStyle("double");
      setTableBorderColor("#c7d2fe");
      setHeaderStyle("minimal");
      setStripeColor("#fafaf9");
    } else if (themePreset === "dark") {
      setFontFamily("mono");
      setHeaderBackgroundColor("#1f2937");
      setHeaderTextColor("#f9fafb");
      setTableBorderStyle("solid");
      setTableBorderColor("#374151");
      setHeaderStyle("modern");
      setStripeColor("#f3f4f6");
    }
  }, [themePreset]);

  // Sync title when opened & Reset after print
  useEffect(() => {
    if (isOpen) {
      setCustomTitle(title);
      setCustomSubtitle(subtitle || "");
    }
  }, [isOpen, title, subtitle]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPreparingPrint(false);
      setShowAllForPrint(false);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const [autoFit, setAutoFit] = useState(true);

  if (!isOpen) return null;

  const toggleColumn = (colKey: string) => {
    setHiddenColumns(prev => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  const handlePrint = () => {
    setIsPreparingPrint(true);
    setShowAllForPrint(true);
    
    // High-performance double-frame render commit before calling window.print
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.print();
          setIsPreparingPrint(false);
        }, 200);
      });
    });
  };

  const handleExport = (format: "csv" | "json" | "txt" | "html") => {
    const cols = currentTemplateObj?.columns?.filter(c => !hiddenColumns[c.key]) || [];
    let content = "";
    let mimeType = "";
    let extension = "";

    if (format === "csv") {
      const headers = cols.map(c => customHeaders[c.key] || c.label).join(',');
      const rows = filteredData.map(row => {
        return cols.map(col => {
          let val = col.render && typeof col.render(row) === 'string' 
            ? col.render(row) 
            : row[col.key];
          val = val ? String(val).replace(/"/g, '""').replace(/\n/g, ' ') : '';
          return `"${val}"`;
        }).join(',');
      });
      content = "\uFEFF" + headers + '\n' + rows.join('\n');
      mimeType = "text/csv;charset=utf-8;";
      extension = "csv";
    } else if (format === "json") {
      const exportData = filteredData.map(row => {
        const obj: any = {};
        cols.forEach(col => {
          let val = col.render && typeof col.render(row) === 'string' ? col.render(row) : row[col.key];
          obj[customHeaders[col.key] || col.label] = val;
        });
        return obj;
      });
      content = JSON.stringify(exportData, null, 2);
      mimeType = "application/json;charset=utf-8;";
      extension = "json";
    } else if (format === "txt") {
      const headers = cols.map(c => customHeaders[c.key] || c.label).join('\t');
      const rows = filteredData.map(row => {
        return cols.map(col => {
          let val = col.render && typeof col.render(row) === 'string' ? col.render(row) : row[col.key];
          return String(val || '').replace(/\t/g, ' ').replace(/\n/g, ' ');
        }).join('\t');
      });
      content = headers + '\n' + rows.join('\n');
      mimeType = "text/plain;charset=utf-8;";
      extension = "txt";
    } else if (format === "html") {
      const headers = cols.map(c => `<th>${customHeaders[c.key] || c.label}</th>`).join('');
      const rows = filteredData.map(row => {
        const rowData = cols.map(col => {
          let val = col.render && typeof col.render(row) === 'string' ? col.render(row) : row[col.key];
          return `<td>${val || ''}</td>`;
        }).join('');
        return `<tr>${rowData}</tr>`;
      }).join('\n');
      content = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>${customTitle}</title><style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:right;}th{background-color:#f2f2f2;}</style></head><body><h2>${customTitle}</h2><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
      mimeType = "text/html;charset=utf-8;";
      extension = "html";
    }

    if (content) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${customTitle || "export"}.${extension}`);
      link.click();
    }
  };

  const previewData = showAllForPrint ? filteredData : filteredData.slice(0, previewLimit);

  const getQrValue = (row: any) => {
    if (qrType === "id") return String(row.id || "N/A");
    if (qrType === "data") return JSON.stringify({ id: row.id, name: row.name || row.studentName || row.title, grade: row.grade });
    return `${qrCodeData}?id=${row.id}`;
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRowIds(next);
  };

  const selectAllRows = () => setSelectedRowIds(new Set(data.map((d: any, i) => d.id || String(i))));
  const deselectAllRows = () => setSelectedRowIds(new Set());

  // Categories for the tabs
  const categories = Array.from(new Set(templates.map(t => t.category)));

  const fontMap = { xs: "text-[10px] leading-tight", sm: "text-xs", base: "text-sm", lg: "text-base", xl: "text-lg" };
  const marginMap = { none: "p-0", sm: "p-4", md: "p-8", lg: "p-12" };

  const tableBorderStyleObj = tableBorderStyle === "none" ? { border: "none" } : { 
    borderStyle: tableBorderStyle, 
    borderWidth: tableBorderWidth, 
    borderColor: tableBorderColor 
  };

  // Generate dynamic CSS for print
  const printCSS = `
    @media print {
      @page { 
        size: A4 ${paperOrientation}; 
        margin: ${marginSize === 'none' ? '0' : marginSize === 'sm' ? '0.8cm' : marginSize === 'md' ? '1.5cm' : '2.5cm'};
      }
      body * {
        visibility: hidden !important;
      }
      .print-paper-canvas,
      .print-paper-canvas * {
        visibility: visible !important;
      }
      .print-paper-canvas {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: ${marginSize === 'none' ? '0' : marginSize === 'sm' ? '10px' : marginSize === 'md' ? '20px' : '30px'} !important;
        box-shadow: none !important;
        border: none !important;
        background-color: white !important;
        color: black !important;
      }
      body {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
        background-color: white !important;
      }
      table { 
        width: 100% !important;
        border-collapse: collapse !important;
        table-layout: auto !important;
        page-break-inside: auto !important;
      }
      tr { 
        page-break-inside: avoid !important; 
        break-inside: avoid !important;
      }
      thead { 
        display: table-header-group !important; 
      }
      tfoot { 
        display: table-footer-group !important; 
      }
      th, td {
        word-break: break-word !important;
        overflow-wrap: break-word !important;
        white-space: normal !important;
        line-height: 1.6 !important;
        vertical-align: middle !important;
        height: auto !important;
        padding: 6px 8px !important;
      }
      .print-controls-sidebar,
      .print-hidden,
      header, nav, aside, button {
        display: none !important;
      }
    }
  `;

  return (
    <div className="fixed inset-0 z-[100] flex bg-black/50 backdrop-blur-sm print:bg-white print:block" dir="rtl">
      <style>{printCSS}</style>
      
      {/* SIDEBAR PROPERTIES PANEL (Right Side in RTL) */}
      <div className="w-[400px] bg-background border-l border-border flex flex-col print:hidden shadow-2xl z-10 overflow-hidden absolute right-0 top-0 bottom-0">
        
        <div className="p-4 border-b border-border bg-card flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black">إعدادات الطباعة المتقدمة</h2>
              <p className="text-[10px] text-muted-foreground">الإصدار 4.0 | التحكم الكامل</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-3 border-b border-border bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">تحرير مباشر للنصوص (WYSIWYG)</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={editMode} onChange={() => setEditMode(!editMode)} />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          <Accordion title="تصفية متقدمة (صفوف وشعب)" icon={Filter} defaultOpen={false}>
            <div className="space-y-4 text-sm">
              {availableGrades.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs mb-2 text-primary">تصفية حسب الصف:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {availableGrades.map(g => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                        <input type="checkbox" checked={selectedGrades.has(g)} onChange={() => {
                          const next = new Set(selectedGrades);
                          if (next.has(g)) next.delete(g); else next.add(g);
                          setSelectedGrades(next);
                        }} className="accent-primary w-4 h-4" />
                        <span className="text-[11px]">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {availableSections.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs mb-2 text-primary border-t pt-2 mt-2">تصفية حسب الشعبة:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {availableSections.map(s => {
                      const secName = globalStore.activeStageSections.find(x => x.id === s)?.name || s;
                      return (
                        <label key={s} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                          <input type="checkbox" checked={selectedSections.has(s)} onChange={() => {
                            const next = new Set(selectedSections);
                            if (next.has(s)) next.delete(s); else next.add(s);
                            setSelectedSections(next);
                          }} className="accent-primary w-4 h-4" />
                          <span className="text-[11px]">شعبة {secName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {availableGrades.length === 0 && availableSections.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">لا توجد بيانات صفوف أو شعب في هذه القائمة.</p>
              )}
            </div>
          </Accordion>

          <Accordion title="البيانات المحددة للطباعة" icon={Users} defaultOpen={true}>
            <div className="text-xs space-y-3">
              <div className="flex gap-2 mb-2">
                <button onClick={selectAllRows} className="flex-1 py-1.5 bg-muted rounded border text-foreground font-medium hover:bg-muted/80">تحديد الكل</button>
                <button onClick={deselectAllRows} className="flex-1 py-1.5 bg-muted rounded border text-foreground font-medium hover:bg-muted/80">إلغاء التحديد</button>
              </div>
              <input 
                type="text" 
                placeholder="بحث سريع للتصفية..." 
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className="w-full border rounded-md p-2 outline-none focus:border-primary bg-background"
              />
              <div className="max-h-[200px] overflow-y-auto border rounded-md divide-y custom-scrollbar bg-background">
                {enrichedData.map((row, idx) => {
                  const rId = row.id || String(idx);
                  const isChecked = selectedRowIds.has(rId);
                  
                  // Hide if filtered out by matrix
                  if (row.grade && !selectedGrades.has(row.grade)) return null;
                  if (row.sectionId && !selectedSections.has(row.sectionId)) return null;

                  return (
                    <label key={rId} className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => toggleRow(rId)} 
                        className="accent-primary w-4 h-4"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold">{row.studentName || row.name || row.title || row.id || `سجل ${idx+1}`}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {row.grade ? `${row.grade}` : (row.category || row.role || "")}
                          {row.sectionId && ` - شعبة ${globalStore.activeStageSections.find(x => x.id === row.sectionId)?.name || row.sectionId}`}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground text-center font-medium">
                تم تحديد {filteredData.length} من أصل {enrichedData.length}
              </p>
            </div>
          </Accordion>

          <Accordion title="قوالب الطباعة" icon={LayoutTemplate} defaultOpen={true}>
            <div className="space-y-3">
              {categories.map(cat => (
                <div key={cat} className="space-y-1">
                  <h4 className="text-[10px] font-bold text-muted-foreground">{cat}</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {templates.filter(t => t.category === cat).map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`w-full text-right px-3 py-2 rounded-lg text-sm font-bold transition-all border flex items-center justify-between ${selectedTemplate === t.id ? "bg-primary/10 text-primary border-primary shadow-sm" : "bg-background border-border hover:border-primary/50"}`}
                      >
                        <div className="flex items-center gap-2">
                          {t.type === 'cards' ? <LayoutGrid className="w-4 h-4 opacity-70" /> :
                           t.type === 'certificate' ? <Award className="w-4 h-4 opacity-70" /> :
                           t.type === 'receipt' ? <FileText className="w-4 h-4 opacity-70" /> :
                           <LayoutTemplate className="w-4 h-4 opacity-70" />}
                          <span>{t.name}</span>
                        </div>
                        {selectedTemplate === t.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Accordion>

          <Accordion title="الثيمات الجاهزة" icon={Settings2}>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setThemePreset("modern")} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${themePreset === "modern" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}>
                <div className="w-full h-8 bg-gray-100 rounded border border-gray-200"></div>
                <span className="text-xs font-bold">عصري</span>
              </button>
              <button onClick={() => setThemePreset("classic")} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${themePreset === "classic" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}>
                <div className="w-full h-8 bg-white rounded border border-black"></div>
                <span className="text-xs font-bold">كلاسيكي</span>
              </button>
              <button onClick={() => setThemePreset("elegant")} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${themePreset === "elegant" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}>
                <div className="w-full h-8 bg-[#fdfbf7] rounded border border-[#c7d2fe]"></div>
                <span className="text-xs font-bold">فاخر</span>
              </button>
              <button onClick={() => setThemePreset("dark")} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${themePreset === "dark" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"}`}>
                <div className="w-full h-8 bg-gray-800 rounded border border-gray-600"></div>
                <span className="text-xs font-bold">داكن</span>
              </button>
            </div>
          </Accordion>

          {currentTemplateObj?.type === "table" && (
            <Accordion title="أعمدة الجدول (إخفاء/إظهار)" icon={LayoutGrid}>
              <div className="space-y-1">
                {currentTemplateObj?.columns?.map(col => (
                  <label key={col.key} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded cursor-pointer text-sm">
                    <input 
                      type="checkbox" 
                      checked={!hiddenColumns[col.key]} 
                      onChange={() => toggleColumn(col.key)}
                      className="accent-primary w-4 h-4"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </Accordion>
          )}

          <Accordion title="إعدادات الورقة الأساسية" icon={FileText}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span>الاتجاه</span>
                <select value={paperOrientation} onChange={e => setPaperOrientation(e.target.value as any)} className="border rounded p-1 text-xs outline-none bg-background">
                  <option value="portrait">طولي</option>
                  <option value="landscape">عرضي</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span>الهوامش</span>
                <select value={marginSize} onChange={e => setMarginSize(e.target.value as any)} className="border rounded p-1 text-xs outline-none bg-background">
                  <option value="none">بدون</option>
                  <option value="sm">ضيقة</option>
                  <option value="md">عادية</option>
                  <option value="lg">واسعة</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span>تصغير آلي للمحتوى (Auto-Fit)</span>
                <input type="checkbox" checked={autoFit} onChange={e => setAutoFit(e.target.checked)} className="accent-primary w-4 h-4" />
              </div>
              <div className="flex justify-between items-center">
                <span>طباعة الألوان والخلفيات</span>
                <input type="checkbox" checked={printBackgrounds} onChange={e => setPrintBackgrounds(e.target.checked)} className="accent-primary w-4 h-4" />
              </div>
              <div className="flex justify-between items-center">
                <span>إطار الورقة</span>
                <input type="checkbox" checked={pageFrame} onChange={e => setPageFrame(e.target.checked)} className="accent-primary w-4 h-4" />
              </div>
              <div className="flex justify-between items-center">
                <span>أسطر إضافية فارغة</span>
                <input type="number" min="0" max="20" value={extraEmptyRows} onChange={e => setExtraEmptyRows(parseInt(e.target.value) || 0)} className="w-16 border rounded p-1 text-xs outline-none bg-background text-center" />
              </div>
            </div>
          </Accordion>

          <Accordion title="تخصيص المحتوى" icon={Image}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span>إظهار الترويسة</span>
                <input type="checkbox" checked={showHeader} onChange={e => setShowHeader(e.target.checked)} className="accent-primary w-4 h-4" />
              </div>
              <div className="flex justify-between items-center">
                <span>التوقيعات أسفل الصفحة</span>
                <input type="checkbox" checked={showSignatures} onChange={e => setShowSignatures(e.target.checked)} className="accent-primary w-4 h-4" />
              </div>
              <div className="space-y-2 border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary">رمز الاستجابة السريع (QR)</span>
                  <input type="checkbox" checked={showQrCode} onChange={e => setShowQrCode(e.target.checked)} className="accent-primary w-4 h-4" />
                </div>
                {showQrCode && (
                  <div className="bg-muted/30 p-2 rounded flex flex-col gap-2">
                    <select value={qrType} onChange={(e) => setQrType(e.target.value as any)} className="border rounded p-1 text-xs outline-none bg-background w-full">
                      <option value="url">رابط تحقق رقمي</option>
                      <option value="id">رقم المعرف المرجعي</option>
                      <option value="data">بيانات السجل كاملة</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </Accordion>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-card flex flex-col gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Accordion title="خيارات التصدير (تحميل كملف)" icon={Download} defaultOpen={false}>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => handleExport('csv')} className="flex items-center gap-2 p-2 text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-200 transition-colors">
                <FileSpreadsheet className="w-4 h-4" /> إكسيل (CSV)
              </button>
              <button onClick={() => handleExport('json')} className="flex items-center gap-2 p-2 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition-colors">
                <Code className="w-4 h-4" /> بيانات (JSON)
              </button>
              <button onClick={() => handleExport('html')} className="flex items-center gap-2 p-2 text-xs font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 rounded border border-orange-200 transition-colors">
                <LayoutTemplate className="w-4 h-4" /> ويب (HTML)
              </button>
              <button onClick={() => handleExport('txt')} className="flex items-center gap-2 p-2 text-xs font-bold bg-gray-50 text-gray-700 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
                <FileText className="w-4 h-4" /> نصي (TXT)
              </button>
            </div>
          </Accordion>
          
          <button onClick={handlePrint} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-bold hover:bg-primary/90 transition-all shadow-md mt-2">
            <Printer className="w-5 h-5" /> طباعة المستند
          </button>
        </div>
      </div>

      {/* MAIN CANVAS (Preview Area) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-200 print:bg-white print:p-0 flex flex-col items-center p-8 mr-[400px] print:mr-0 print:w-full print:block">
        
        {isPreparingPrint && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm print:hidden">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-bold text-primary">جاري تحضير المستند للطباعة...</h2>
            <p className="text-muted-foreground mt-2 text-sm font-medium">يرجى الانتظار، قد يستغرق ذلك بضع ثوانٍ للبيانات الضخمة.</p>
          </div>
        )}

        {!showAllForPrint && filteredData.length > previewLimit && (
          <div className="bg-amber-100 text-amber-800 border border-amber-200 px-4 py-3 rounded-lg mb-6 text-sm font-bold flex items-center justify-between w-full max-w-2xl print:hidden shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                البيانات ضخمة: يتم عرض {previewLimit} سجل فقط في المعاينة لتجنب تعليق المتصفح. 
                <span className="opacity-80 block text-xs mt-1">(سيتم طباعة جميع السجلات الـ {filteredData.length} تلقائياً عند الضغط على زر الطباعة)</span>
              </span>
            </div>
            <button onClick={() => setPreviewLimit(prev => prev + 100)} className="bg-amber-200 hover:bg-amber-300 px-4 py-2 rounded-md text-amber-900 transition-colors shadow-sm whitespace-nowrap mr-4">
              عرض 100 إضافية
            </button>
          </div>
        )}

        {/* Floating Toolbar Hint */}
        {editMode && (
          <div className="sticky top-4 z-50 bg-primary text-primary-foreground px-6 py-2.5 rounded-full shadow-lg text-sm font-bold flex items-center gap-3 mb-6 animate-in slide-in-from-top-4 print:hidden">
            <Edit3 className="w-5 h-5" /> 
            يمكنك الآن الضغط على أي نص في الورقة وتعديله مباشرة!
          </div>
        )}

        {/* The Paper */}
        <div 
          className={`bg-white shadow-2xl print:shadow-none transition-all relative print-paper-canvas ${paperOrientation === 'landscape' ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'} ${marginMap[marginSize]} ${pageFrame ? 'ring-4 ring-offset-4 ring-offset-white' : ''}`}
          style={{
            fontFamily: fontFamily === 'sans' ? 'sans-serif' : fontFamily === 'serif' ? 'serif' : fontFamily === 'mono' ? 'monospace' : 'Cairo, sans-serif',
            color: textColor,
            ...(pageFrame && { outlineStyle: pageFrameStyle, outlineColor: tableBorderColor, outlineWidth: '4px' })
          }}
        >
          {/* Header */}
          {showHeader && (
            <div className={`mb-8 flex items-center justify-between border-b-2 pb-4`} style={{ borderColor: tableBorderColor }}>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 flex items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" style={{ borderColor: tableBorderColor }}>
                  <span className="text-[10px] text-muted-foreground text-center px-2">اضغط لإضافة<br/>شعار</span>
                </div>
                <div>
                  <EditableText tagName="h1" value="المملكة العربية السعودية" className="text-sm font-bold mb-1 hover:bg-muted/50 p-1 rounded" />
                  <EditableText tagName="h2" value="وزارة التعليم" className="text-sm font-bold mb-1 hover:bg-muted/50 p-1 rounded" />
                  <EditableText tagName="h3" value="إدارة التعليم بالمنطقة" className="text-sm font-bold mb-1 hover:bg-muted/50 p-1 rounded" />
                  <EditableText tagName="h4" value="مدرسة التقدم الأهلية" className="text-sm font-bold hover:bg-muted/50 p-1 rounded" />
                </div>
              </div>
              <div className="text-center">
                <EditableText tagName="h2" value={customTitle} onChange={setCustomTitle} className="text-2xl font-black mb-2 hover:bg-muted/50 p-2 rounded block" style={{ color: titleColor }} />
                <EditableText tagName="p" value={customSubtitle || "أضف عنوان فرعي هنا"} onChange={setCustomSubtitle} className="text-sm opacity-80 hover:bg-muted/50 p-1 rounded block" />
              </div>
              <div className="text-left space-y-1">
                <div className="flex gap-2 justify-end text-sm">
                  <span className="font-bold">التاريخ:</span>
                  <EditableText tagName="span" value={new Date().toLocaleDateString('ar-SA')} className="hover:bg-muted/50 p-1 rounded" />
                </div>
                <div className="flex gap-2 justify-end text-sm">
                  <span className="font-bold">رقم السجل:</span>
                  <EditableText tagName="span" value="104/2023" className="hover:bg-muted/50 p-1 rounded" />
                </div>
              </div>
            </div>
          )}

          {/* Type: TABLE */}
          {currentTemplateObj?.type === "table" && (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-right border-collapse" style={{ ...tableBorderStyleObj, tableLayout: 'auto' }}>
                <thead style={{ display: 'table-header-group' }}>
                  <tr>
                    {showPageNumbers && <th className="p-2 border font-bold w-12 text-center" style={{ backgroundColor: headerBackgroundColor, color: headerTextColor, ...tableBorderStyleObj, lineHeight: '1.6', verticalAlign: 'middle' }}>#</th>}
                    {currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).map(col => (
                      <th key={col.key} className="p-2.5 border font-bold hover:bg-black/5 transition-colors text-right" style={{ backgroundColor: headerBackgroundColor, color: headerTextColor, ...tableBorderStyleObj, lineHeight: '1.6', verticalAlign: 'middle', wordBreak: 'break-word' }}>
                        <EditableText 
                          tagName="div" 
                          value={customHeaders[col.key] || col.label} 
                          onChange={(val: string) => setCustomHeaders(prev => ({...prev, [col.key]: val}))}
                          className="block w-full p-1 leading-relaxed font-bold text-right"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={fontMap[dataFontSize]}>
                  {previewData.map((row, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : stripeColor, pageBreakInside: 'avoid' }}>
                      {showPageNumbers && <td className="p-2 border text-center font-bold" style={{ ...tableBorderStyleObj, verticalAlign: 'middle', lineHeight: '1.6' }}>{idx + 1}</td>}
                      {currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).map(col => {
                        const cellValue = col.render ? col.render(row) : row[col.key] ?? "-";
                        return (
                          <td key={col.key} className="p-2.5 border text-right" style={{ ...tableBorderStyleObj, verticalAlign: 'middle', lineHeight: '1.6', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {editMode && !showAllForPrint ? (
                              <EditableText tagName="div" value={cellValue} className="block w-full p-1 hover:bg-muted/50 leading-relaxed text-right" />
                            ) : (
                              <div className="block w-full p-1 font-semibold leading-relaxed text-right">
                                {React.isValidElement(cellValue) ? cellValue : (cellValue !== undefined && cellValue !== null ? String(cellValue) : "-")}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {Array.from({ length: extraEmptyRows }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      {showPageNumbers && <td className="p-2 border text-center" style={tableBorderStyleObj}>{previewData.length + idx + 1}</td>}
                      {currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).map(col => (
                        <td key={col.key} className="p-2 border h-10 hover:bg-muted/10" style={tableBorderStyleObj}>
                           <EditableText tagName="div" value="" className="block w-full h-full p-1" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Type: CARDS */}
          {currentTemplateObj?.type === "cards" && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {previewData.map((row, idx) => (
                <div key={idx} className={`rounded-xl border shadow-sm flex flex-col bg-white overflow-hidden`} style={{ borderColor: tableBorderColor, ...tableBorderStyleObj }}>
                  <div className="h-16 flex items-center justify-center p-3 text-center border-b" style={{ backgroundColor: headerBackgroundColor, borderColor: tableBorderColor }}>
                    <EditableText tagName="span" className="font-bold text-lg hover:bg-black/5 p-1 rounded w-full" style={{ color: headerTextColor }} value={row[currentTemplateObj.columns?.[0]?.key || "id"]} />
                  </div>
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    {currentTemplateObj.columns?.slice(1).filter(c => !hiddenColumns[c.key]).map((col) => (
                      <div key={col.key} className="flex flex-col gap-1 border-b border-dashed pb-2 last:border-0" style={{ borderColor: tableBorderColor }}>
                        <EditableText tagName="span" className="text-xs font-bold opacity-60 hover:bg-muted/50 p-1 rounded" value={customHeaders[col.key] || col.label} />
                        <EditableText tagName="span" className="font-bold text-base hover:bg-muted/50 p-1 rounded" value={col.render ? col.render(row) : row[col.key]} />
                      </div>
                    ))}
                  </div>
                  {showQrCode && (
                    <div className="p-3 border-t flex justify-center bg-gray-50" style={{ borderColor: tableBorderColor }}>
                      <QRCode value={getQrValue(row)} size={64} level="L" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Type: CERTIFICATE */}
          {currentTemplateObj?.type === "certificate" && (
            <div className="space-y-8 flex flex-col items-center justify-center min-h-[500px]">
              {previewData.map((row, idx) => (
                <div key={idx} className="relative w-full max-w-4xl p-16 text-center border-[12px] bg-white shadow-lg break-inside-avoid mb-8" style={{ borderColor: headerBackgroundColor, borderStyle: tableBorderStyle === 'none' ? 'solid' : tableBorderStyle }}>
                  <div className="absolute inset-2 border-4 border-dashed pointer-events-none" style={{ borderColor: tableBorderColor, opacity: 0.3 }}></div>
                  <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="flex items-center justify-center gap-4 text-primary">
                      <Award className="w-20 h-20" style={{ color: headerBackgroundColor }} />
                    </div>
                    <div className="space-y-4">
                      <EditableText tagName="h1" className="text-6xl font-black hover:bg-muted/50 p-2 rounded inline-block" style={{ color: titleColor }} value="شهادة تقدير وتفوق" />
                      <EditableText tagName="p" className="text-xl font-medium hover:bg-muted/50 p-2 rounded block" value="تتشرف إدارة المدرسة بأن تمنح هذه الشهادة للطالب/ة:" />
                    </div>
                    <EditableText tagName="h2" className="text-5xl font-black border-b-4 pb-4 px-12 hover:bg-muted/50 rounded" style={{ color: headerTextColor, borderColor: tableBorderColor }} value={row.name || row[currentTemplateObj.columns?.[0]?.key || "id"]} />
                    <EditableText tagName="p" className="text-2xl font-medium max-w-2xl leading-relaxed hover:bg-muted/50 p-4 rounded" value="تقديراً لجهوده المبذولة وتفوقه الأكاديمي الملحوظ خلال العام الدراسي، متمنين له دوام التقدم والنجاح." />
                    
                    <div className="grid grid-cols-2 gap-32 mt-16 w-full px-16">
                      <div className="flex flex-col items-center gap-4">
                        <EditableText tagName="span" className="font-bold text-xl hover:bg-muted/50 p-2 rounded" value={sig1Label} onChange={setSig1Label} />
                        <div className="w-56 border-b-2" style={{ borderColor: tableBorderColor }}></div>
                      </div>
                      <div className="flex flex-col items-center gap-4">
                        <EditableText tagName="span" className="font-bold text-xl hover:bg-muted/50 p-2 rounded" value={sig3Label} onChange={setSig3Label} />
                        <div className="w-56 border-b-2" style={{ borderColor: tableBorderColor }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Type: RECEIPT */}
          {currentTemplateObj?.type === "receipt" && (
            <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
              {previewData.map((row, idx) => (
                <div key={idx} className="border-2 p-8 bg-white break-inside-avoid relative shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: tableBorderColor, borderStyle: tableBorderStyle === 'none' ? 'solid' : tableBorderStyle }}>
                  <div className="flex justify-between items-start mb-8 border-b-2 pb-4" style={{ borderColor: tableBorderColor }}>
                    <div>
                      <EditableText tagName="h2" className="text-2xl font-black mb-1 hover:bg-muted/50 p-1 rounded" style={{ color: headerTextColor }} value="سند قبض / إيصال استلام" />
                      <div className="flex gap-2 text-sm text-muted-foreground mt-2">
                        <span className="font-bold">رقم السند:</span> <EditableText tagName="span" className="font-bold text-foreground hover:bg-muted/50 p-1 rounded" value={row.id || `REC-${1000+idx}`} />
                      </div>
                    </div>
                    {showQrCode && <QRCode value={getQrValue(row)} size={70} level="L" />}
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-muted/10 p-5 rounded-lg border border-dashed" style={{ borderColor: tableBorderColor }}>
                      <span className="font-bold text-lg">المبلغ المستلم:</span>
                      <EditableText tagName="span" className="text-4xl font-black text-primary hover:bg-primary/10 p-2 rounded" value={row.amount || row.net || "0.00 {currency}"} />
                    </div>
                    
                    <div className="grid grid-cols-[140px_1fr] gap-6 items-center text-lg">
                      <span className="font-bold text-muted-foreground">استلمنا من السيد/ة:</span>
                      <EditableText tagName="div" className="border-b-2 border-dotted pb-2 font-bold hover:bg-muted/50 rounded px-2" style={{ borderColor: tableBorderColor }} value={row.name || row.studentName || ""} />
                      
                      <span className="font-bold text-muted-foreground">وذلك لقاء:</span>
                      <EditableText tagName="div" className="border-b-2 border-dotted pb-2 font-bold hover:bg-muted/50 rounded px-2" style={{ borderColor: tableBorderColor }} value={row.description || customOptions['receiptReason'] || "رسوم دراسية"} />
                      
                      <span className="font-bold text-muted-foreground">تاريخ الاستلام:</span>
                      <EditableText tagName="div" className="border-b-2 border-dotted pb-2 font-bold hover:bg-muted/50 rounded px-2" style={{ borderColor: tableBorderColor }} value={row.date || new Date().toLocaleDateString('ar-SA')} />
                    </div>
                  </div>

                  <div className="flex justify-between mt-12 pt-8 border-t-2 border-dashed" style={{ borderColor: tableBorderColor }}>
                    <div className="text-center">
                      <EditableText tagName="p" className="font-bold mb-8 hover:bg-muted/50 p-1 rounded inline-block" value="المستلم (المحاسب)" />
                      <div className="w-40 border-b-2 mx-auto" style={{ borderColor: tableBorderColor }}></div>
                    </div>
                    <div className="text-center">
                      <EditableText tagName="p" className="font-bold mb-8 hover:bg-muted/50 p-1 rounded inline-block" value="الختم الرسمي" />
                      <div className="w-32 h-16 border-2 rounded-full mx-auto opacity-20" style={{ borderColor: tableBorderColor }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Type: DOCUMENT (Custom Render with Page Breaks) */}
          {currentTemplateObj?.type === "document" && currentTemplateObj.renderDocument && (
            <div className="w-full flex flex-col">
              {previewData.map((row, idx) => (
                <div key={idx} className="w-full print:break-after-page border-b-4 print:border-b-0 border-dashed border-primary/20 pb-16 mb-16 print:mb-0 print:pb-0 last:border-b-0 last:mb-0 last:pb-0 relative">
                  {currentTemplateObj.renderDocument?.({ ...{ hiddenColumns, fontSize: dataFontSize, stripeRows: true, extraEmptyRows, showHeader, showSignatures, customNote, customOptions, themePreset } }, [row])}
                  
                  {/* Footer inside document page if needed */}
                  {showQrCode && (
                    <div className="absolute bottom-8 left-8 print:fixed print:bottom-8 print:left-8">
                       <QRCode value={getQrValue(row)} size={70} level="L" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer Signatures (For Tables mainly) */}
          {showSignatures && currentTemplateObj?.type === "table" && (
            <div className="mt-16 flex justify-between px-8 pb-8">
              <div className="text-center">
                <EditableText tagName="p" className="font-bold mb-8 hover:bg-muted/50 p-2 rounded" value={sig1Label} onChange={setSig1Label} />
                <div className="w-48 border-b-2" style={{ borderColor: tableBorderColor }}></div>
              </div>
              <div className="text-center">
                <EditableText tagName="p" className="font-bold mb-8 hover:bg-muted/50 p-2 rounded" value={sig2Label} onChange={setSig2Label} />
                <div className="w-48 border-b-2" style={{ borderColor: tableBorderColor }}></div>
              </div>
              <div className="text-center">
                <EditableText tagName="p" className="font-bold mb-8 hover:bg-muted/50 p-2 rounded" value={sig3Label} onChange={setSig3Label} />
                <div className="w-48 border-b-2" style={{ borderColor: tableBorderColor }}></div>
              </div>
            </div>
          )}

          {/* QR Footer */}
          {showQrCode && currentTemplateObj?.type === "table" && (
            <div className="mt-8 flex justify-center pb-8 print:fixed print:bottom-8 print:left-1/2 print:-translate-x-1/2">
               <QRCode value={qrCodeData} size={80} level="L" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
