import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  Printer, 
  X, 
  LayoutTemplate, 
  Download, 
  Edit3, 
  Settings2, 
  FileText, 
  Image as ImageIcon, 
  LayoutGrid, 
  Award, 
  QrCode, 
  CheckSquare, 
  Square, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Filter, 
  FileSpreadsheet, 
  Code, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Check, 
  Sparkles, 
  Columns, 
  PenTool, 
  BadgeCheck, 
  ShieldAlert,
  PanelRightClose,
  PanelRightOpen,
  ArrowRightLeft
} from "lucide-react";
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
  themePreset: "modern" | "classic" | "elegant" | "dark" | "official";
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

export interface AdvancedPrintEngineProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title?: string;
  defaultTitle?: string;
  subtitle?: string;
  data?: any[];
  templates: PrintTemplate[];
  defaultTemplateId?: string;
}

// Luxury Accordion Component
function Accordion({ 
  title, 
  icon: Icon, 
  badge,
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  icon: any; 
  badge?: string | number;
  children: React.ReactNode; 
  defaultOpen?: boolean; 
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/70 rounded-2xl overflow-hidden bg-card/60 transition-all shadow-xs">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-3.5 hover:bg-accent/60 transition-colors text-right select-none"
      >
        <div className="flex items-center gap-2.5 font-bold text-xs text-foreground">
          <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span>{title}</span>
          {badge !== undefined && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <div className="text-muted-foreground/60 transition-transform duration-200">
          {isOpen ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {isOpen && (
        <div className="p-3.5 pt-0 border-t border-border/40 bg-background/50 space-y-3.5 animate-in slide-in-from-top-1 duration-200">
          <div className="pt-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// Editable Text Component with Clean Typography (No Mid-Word Breaks)
function EditableText({ 
  value, 
  onChange, 
  className = "", 
  style = {}, 
  tagName: Tag = "div",
  isNumeric = false
}: {
  value: any;
  onChange?: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  tagName?: any;
  isNumeric?: boolean;
}) {
  const isReactElement = React.isValidElement(value);

  if (isReactElement) {
    return (
      <Tag 
        className={`outline-none block w-full leading-normal ${className}`} 
        style={style}
      >
        {value}
      </Tag>
    );
  }

  const baseStyle: React.CSSProperties = {
    lineHeight: "1.4",
    wordBreak: isNumeric ? "normal" : "keep-all",
    whiteSpace: isNumeric ? "nowrap" : "normal",
    ...style
  };

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: any) => onChange && onChange(e.target.innerText)}
      className={`outline-none focus:ring-2 focus:ring-primary/40 focus:bg-primary/10 rounded-md transition-all cursor-text block leading-normal ${className}`}
      style={baseStyle}
      dangerouslySetInnerHTML={{ __html: String(value ?? "") }}
    />
  );
}

export function AdvancedPrintEngine({
  isOpen: isOpenProp,
  open: openProp,
  onClose,
  title = "تقرير مخصص",
  defaultTitle,
  subtitle,
  data = [],
  templates,
  defaultTemplateId
}: AdvancedPrintEngineProps) {
  const isOpen = isOpenProp ?? openProp ?? false;
  const globalStore = useGlobalStore();
  const effectiveTitle = defaultTitle || title;
  
  // Basic State
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplateId || templates[0]?.id || "");
  const [editMode, setEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Custom text states that override default props
  const [customTitle, setCustomTitle] = useState(effectiveTitle);
  const [customSubtitle, setCustomSubtitle] = useState(subtitle || "");
  const [customNote, setCustomNote] = useState("");
  const [customOptions, setCustomOptions] = useState<Record<string, any>>({});
  
  // Column overrides (for headers)
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({});

  // Live Zoom State
  const [zoom, setZoom] = useState(0.85);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Data Filtering
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set());
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [qrType, setQrType] = useState<"url" | "data" | "id">("url");

  // Auto-Enrichment
  const enrichedData = useMemo(() => {
    return data.map(row => {
      let enriched = { ...row };
      if (row.studentId) {
         const s = globalStore.activeStageStudents.find(st => st.id === row.studentId || (st as any).studentId === row.studentId);
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
      setSelectedRowIds(new Set());
      setSelectedGrades(new Set());
      setSelectedSections(new Set());
    }
  }, [isOpen, enrichedData, availableGrades, availableSections, selectedRowIds.size]);

  const filteredData = useMemo(() => {
    return enrichedData.filter((row: any, i: number) => {
      const id = row.id || String(i);
      if (!selectedRowIds.has(id)) return false;
      
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
  const [themePreset, setThemePreset] = useState<"modern" | "classic" | "elegant" | "dark" | "official">("official");
  const [tableBorderStyle, setTableBorderStyle] = useState<"none" | "solid" | "dashed" | "dotted" | "double">("solid");
  const [tableBorderWidth, setTableBorderWidth] = useState<"1px" | "2px" | "3px">("1px");
  const [tableBorderColor, setTableBorderColor] = useState("#d1d5db");
  const [headerBackgroundColor, setHeaderBackgroundColor] = useState("#f1f5f9");
  const [headerTextColor, setHeaderTextColor] = useState("#0f172a");
  const [stripeColor, setStripeColor] = useState("#f8fafc");
  const [extraEmptyRows, setExtraEmptyRows] = useState(0);

  // Typography
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono" | "cairo">("cairo");
  const [dataFontSize, setDataFontSize] = useState<"xs" | "sm" | "base" | "lg" | "xl">("sm");
  const [textColor, setTextColor] = useState("#0f172a");
  const [titleColor, setTitleColor] = useState("#0f172a");

  // Content Controls
  const [showHeader, setShowHeader] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [sig1Label, setSig1Label] = useState("شؤون الطلاب");
  const [sig2Label, setSig2Label] = useState("المراجعة والتدقيق");
  const [sig3Label, setSig3Label] = useState("مدير المدرسة المعتمد");
  
  // Advanced
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("https://school.sa/verify");

  // Performance and Print
  const [previewLimit, setPreviewLimit] = useState(50);
  const [showAllForPrint, setShowAllForPrint] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printScope, setPrintScope] = useState<"page" | "50" | "100" | "all">("page");

  const printableData = useMemo(() => {
    if (printScope === "page") return filteredData.slice(0, 30);
    if (printScope === "50") return filteredData.slice(0, 50);
    if (printScope === "100") return filteredData.slice(0, 100);
    return filteredData;
  }, [filteredData, printScope]);

  const currentTemplateObj = templates.find(t => t.id === selectedTemplate) || templates[0];

  // Apply Theme Presets
  useEffect(() => {
    if (themePreset === "official") {
      setFontFamily("cairo");
      setHeaderBackgroundColor("#f8fafc");
      setHeaderTextColor("#0f172a");
      setTableBorderStyle("solid");
      setTableBorderWidth("1px");
      setTableBorderColor("#cbd5e1");
      setStripeColor("#f8fafc");
      setTextColor("#0f172a");
      setTitleColor("#0f172a");
    } else if (themePreset === "classic") {
      setFontFamily("serif");
      setHeaderBackgroundColor("#ffffff");
      setHeaderTextColor("#000000");
      setTableBorderStyle("solid");
      setTableBorderWidth("1px");
      setTableBorderColor("#000000");
      setStripeColor("#f9fafb");
      setTextColor("#000000");
      setTitleColor("#000000");
    } else if (themePreset === "modern") {
      setFontFamily("sans");
      setHeaderBackgroundColor("#eff6ff");
      setHeaderTextColor("#1e3a8a");
      setTableBorderStyle("solid");
      setTableBorderWidth("1px");
      setTableBorderColor("#bfdbfe");
      setStripeColor("#f8fafc");
      setTextColor("#0f172a");
      setTitleColor("#1e3a8a");
    } else if (themePreset === "elegant") {
      setFontFamily("cairo");
      setHeaderBackgroundColor("#fdfbf7");
      setHeaderTextColor("#4338ca");
      setTableBorderStyle("double");
      setTableBorderWidth("3px");
      setTableBorderColor("#c7d2fe");
      setStripeColor("#fafaf9");
      setTextColor("#1e1b4b");
      setTitleColor("#312e81");
    } else if (themePreset === "dark") {
      setFontFamily("mono");
      setHeaderBackgroundColor("#1f2937");
      setHeaderTextColor("#f9fafb");
      setTableBorderStyle("solid");
      setTableBorderWidth("1px");
      setTableBorderColor("#374151");
      setStripeColor("#f3f4f6");
      setTextColor("#111827");
      setTitleColor("#111827");
    }
  }, [themePreset]);

  // Sync title when opened & Reset after print
  useEffect(() => {
    if (isOpen) {
      setCustomTitle(effectiveTitle);
      setCustomSubtitle(subtitle || "");
    }
  }, [isOpen, effectiveTitle, subtitle]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPreparingPrint(false);
      setShowAllForPrint(false);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  // Keyboard shortcut Ctrl/Cmd + P to trigger print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p" && isOpen) {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredData]);

  // Fit to screen calculation
  const handleFitToScreen = () => {
    if (canvasRef.current) {
      const containerWidth = canvasRef.current.clientWidth - 48;
      const paperWidthPx = paperOrientation === "landscape" ? 1122 : 794;
      const scale = Math.min(1.1, Math.max(0.45, containerWidth / paperWidthPx));
      setZoom(Math.round(scale * 100) / 100);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Auto-fit on open
      setTimeout(handleFitToScreen, 100);
    }
  }, [isOpen, paperOrientation, sidebarOpen]);

  if (!isOpen) return null;

  const toggleColumn = (colKey: string) => {
    setHiddenColumns(prev => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  const printCanvasViaIframe = (canvasEl: HTMLElement) => {
    const existingIframe = document.getElementById("print-isolated-iframe");
    if (existingIframe) existingIframe.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "print-isolated-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const headStyles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map(el => el.outerHTML)
      .join("\n");

    const marginVal = marginSize === 'none' ? '0' : marginSize === 'sm' ? '0.8cm' : marginSize === 'md' ? '1.2cm' : '2.0cm';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>${customTitle || "كشف طباعة معتمد"}</title>
        <base href="${window.location.origin}/" />
        ${headStyles}
        <style>
          @page {
            size: A4 ${paperOrientation};
            margin: ${marginVal};
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-paper-canvas {
            position: relative !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            outline: none !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-header-grid {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            width: 100% !important;
            min-width: 100% !important;
            margin-bottom: 20px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-header-col-right {
            width: 32% !important;
            min-width: 32% !important;
            text-align: right !important;
            flex-shrink: 0 !important;
          }
          .print-header-col-center {
            width: 36% !important;
            min-width: 36% !important;
            text-align: center !important;
            flex-shrink: 0 !important;
          }
          .print-header-col-left {
            width: 32% !important;
            min-width: 32% !important;
            text-align: left !important;
            flex-shrink: 0 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: table-row !important;
          }
          thead {
            display: table-header-group !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tbody {
            display: table-row-group !important;
          }
          th, td {
            padding: 6px 10px !important;
            vertical-align: middle !important;
            word-break: normal !important;
          }
          .print-hidden, button, header.print-hidden {
            display: none !important;
          }
        </style>
      </head>
      <body class="bg-white text-slate-900 font-sans" dir="rtl">
        ${canvasEl.outerHTML}
      </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch {
        window.print();
      } finally {
        setIsPreparingPrint(false);
      }
    }, 350);
  };

  const handlePrint = () => {
    setIsPreparingPrint(true);
    setShowAllForPrint(true);
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        const canvasEl = document.querySelector(".print-paper-canvas") as HTMLElement;
        if (canvasEl) {
          printCanvasViaIframe(canvasEl);
        } else {
          window.print();
          setIsPreparingPrint(false);
        }
      }, 200);
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
      content = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>${customTitle}</title><style>body{font-family:Cairo,sans-serif;padding:24px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #cbd5e1;padding:8px 12px;text-align:right;}th{background-color:#f1f5f9;font-weight:bold;}</style></head><body><h2>${customTitle}</h2><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
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

  const previewData = showAllForPrint ? printableData : printableData.slice(0, previewLimit);

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

  const selectAllRows = () => setSelectedRowIds(new Set(enrichedData.map((d: any, i) => d.id || String(i))));
  const deselectAllRows = () => setSelectedRowIds(new Set());

  // Categories for the tabs
  const categories = Array.from(new Set(templates.map(t => t.category)));

  const fontMap = { 
    xs: "text-[11px]", 
    sm: "text-xs", 
    base: "text-sm", 
    lg: "text-base", 
    xl: "text-lg" 
  };
  const marginMap = { 
    none: "p-0", 
    sm: "p-5", 
    md: "p-8 sm:p-10", 
    lg: "p-12 sm:p-14" 
  };

  const tableBorderStyleObj = tableBorderStyle === "none" ? { border: "none" } : { 
    borderStyle: tableBorderStyle, 
    borderWidth: tableBorderWidth, 
    borderColor: tableBorderColor 
  };

  // Precise Print CSS
  const printCSS = `
    @media print {
      @page { 
        size: A4 ${paperOrientation}; 
        margin: ${marginSize === 'none' ? '0' : marginSize === 'sm' ? '0.8cm' : marginSize === 'md' ? '1.2cm' : '2.0cm'};
      }

      html, body {
        width: 100% !important;
        height: auto !important;
        min-height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body * {
        visibility: hidden !important;
      }

      .print-engine-modal,
      .print-engine-modal *,
      .print-paper-canvas,
      .print-paper-canvas * {
        visibility: visible !important;
      }

      .print-engine-modal {
        position: static !important;
        inset: auto !important;
        width: 100% !important;
        height: auto !important;
        min-height: 100% !important;
        max-height: none !important;
        overflow: visible !important;
        background: transparent !important;
        display: block !important;
        transform: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        z-index: auto !important;
      }

      .print-engine-body,
      .print-engine-scroll,
      .print-engine-scale {
        position: static !important;
        overflow: visible !important;
        width: 100% !important;
        height: auto !important;
        max-height: none !important;
        display: block !important;
        transform: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .print-paper-canvas {
        position: relative !important;
        display: block !important;
        left: auto !important;
        top: auto !important;
        width: 100% !important;
        max-width: 100% !important;
        min-height: auto !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        outline: none !important;
        background: #ffffff !important;
        color: #000000 !important;
        transform: none !important;
        page-break-after: auto !important;
        break-after: auto !important;
      }

      .print-header-grid {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: center !important;
        width: 100% !important;
        min-width: 100% !important;
        margin-bottom: 20px !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      .print-header-col-right {
        width: 32% !important;
        min-width: 32% !important;
        text-align: right !important;
        flex-shrink: 0 !important;
      }

      .print-header-col-center {
        width: 36% !important;
        min-width: 36% !important;
        text-align: center !important;
        flex-shrink: 0 !important;
      }

      .print-header-col-left {
        width: 32% !important;
        min-width: 32% !important;
        text-align: left !important;
        flex-shrink: 0 !important;
      }

      table { 
        width: 100% !important;
        border-collapse: collapse !important;
        page-break-inside: auto !important;
        break-inside: auto !important;
      }

      tr { 
        page-break-inside: avoid !important; 
        break-inside: avoid !important;
        display: table-row !important;
      }

      thead { 
        display: table-header-group !important; 
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      tbody {
        display: table-row-group !important;
      }

      tfoot { 
        display: table-footer-group !important; 
      }

      th, td {
        padding: 6px 10px !important;
        vertical-align: middle !important;
        word-break: normal !important;
      }

      .print-hidden,
      .print-controls-bar,
      .print-sidebar,
      header, nav, aside, button {
        display: none !important;
      }
    }
  `;

  // Determine if a column is a phone or numeric or code
  const isCodeOrPhone = (key: string, label: string) => {
    const k = key.toLowerCase();
    const l = label.toLowerCase();
    return (
      k.includes("phone") || k.includes("mobile") || k.includes("tel") || 
      l.includes("جوال") || l.includes("هاتف") ||
      k.includes("id") || k.includes("code") || k.includes("national") ||
      l.includes("قيد") || l.includes("هوية") || l.includes("كود") || l.includes("رمز")
    );
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/80 backdrop-blur-xl print:bg-white print:block overflow-hidden print-engine-modal" dir="rtl">
      <style>{printCSS}</style>

      {/* =========================================================
          TOP COMMAND BAR (Sticky Header)
          ========================================================= */}
      <header className="h-16 border-b border-border/80 bg-card/95 backdrop-blur-2xl px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 shadow-sm z-30 print:hidden">
        
        {/* Right: Engine Title & Template Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center shadow-md glow-primary shrink-0">
            <Printer className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-foreground truncate">
                إعدادات ومعاينة الطباعة
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                {currentTemplateObj?.name || "كشف معتمد"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold truncate hidden sm:block">
              تصدير رسمي عالي الدقة • محدد ({filteredData.length} من {enrichedData.length})
            </p>
          </div>
        </div>

        {/* Center: Live Zoom & Orientation Controls */}
        <div className="flex items-center gap-1 sm:gap-2 bg-muted/40 p-1 rounded-2xl border border-border/60 shrink-0">
          
          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(0.4, Math.round((z - 0.1) * 100) / 100))}
            className="p-1.5 rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
            title="تصغير المعاينة (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Indicator */}
          <span className="text-xs font-black px-2 tabular-nums text-foreground select-none min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(1.5, Math.round((z + 0.1) * 100) / 100))}
            className="p-1.5 rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
            title="تكبير المعاينة (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-border/60 mx-0.5" />

          {/* Auto Fit */}
          <button
            type="button"
            onClick={handleFitToScreen}
            className="px-2.5 py-1 rounded-xl hover:bg-card text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            title="احتواء الشاشة تلقائياً"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">احتواء</span>
          </button>

          <div className="w-px h-4 bg-border/60 mx-0.5" />

          {/* Orientation Toggle */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPaperOrientation("portrait")}
              className={`px-2 py-1 rounded-xl text-xs font-bold transition-all ${
                paperOrientation === "portrait"
                  ? "bg-primary text-primary-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="اتجاه طولي (Portrait)"
            >
              طولي
            </button>
            <button
              type="button"
              onClick={() => setPaperOrientation("landscape")}
              className={`px-2 py-1 rounded-xl text-xs font-bold transition-all ${
                paperOrientation === "landscape"
                  ? "bg-primary text-primary-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="اتجاه عرضي (Landscape)"
            >
              عرضي
            </button>
          </div>

          <div className="w-px h-4 bg-border/60 mx-0.5 hidden sm:block" />

          {/* WYSIWYG Toggle Button */}
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              editMode
                ? "bg-amber-500 text-white shadow-xs font-black animate-pulse"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
            title="تفعيل إمكانية النقر على أي نص وتعديله فوراً"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{editMode ? "وضع التحرير نشط" : "تحرير النصوص"}</span>
          </button>

          <div className="w-px h-4 bg-border/60 mx-0.5 hidden sm:block" />

          {/* Print Scope Selector */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPrintScope("page")}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                printScope === "page"
                  ? "bg-primary text-primary-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="طباعة أول 30 سجل فقط"
            >
              الصفحة الأولى (30)
            </button>
            <button
              type="button"
              onClick={() => setPrintScope("50")}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                printScope === "50"
                  ? "bg-primary text-primary-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="طباعة أول 50 سجل"
            >
              50
            </button>
            <button
              type="button"
              onClick={() => setPrintScope("all")}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                printScope === "all"
                  ? "bg-primary text-primary-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={`طباعة جميع السجلات (${filteredData.length} سجل)`}
            >
              الكل ({filteredData.length})
            </button>
          </div>
        </div>

        {/* Left: Actions, Toggle Sidebar & Close */}
        <div className="flex items-center gap-2">
          
          {/* Main Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] glow-primary"
            title="طباعة الآن (Ctrl + P)"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة المستند</span>
          </button>

          {/* Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(v => !v)}
            className={`p-2 rounded-xl border transition-colors ${
              sidebarOpen
                ? "bg-card border-border/80 text-primary"
                : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
            }`}
            title={sidebarOpen ? "إخفاء لوحة الإعدادات" : "إظهار لوحة الإعدادات"}
          >
            {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button 
            type="button"
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            title="إغلاق المعاينة"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* =========================================================
          MAIN WORKSPACE (Split Canvas & Settings Drawer)
          ========================================================= */}
      <div className="flex-1 flex overflow-hidden relative print-engine-body">

        {/* CENTER / LEFT: CANVAS PREVIEW AREA */}
        <div 
          ref={canvasRef}
          className="flex-1 overflow-auto bg-slate-900/60 dark:bg-black/80 flex flex-col items-center p-4 sm:p-8 custom-scrollbar relative print-engine-scroll"
        >
          {/* Loading Indicator for huge datasets */}
          {isPreparingPrint && (
            <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md print:hidden">
              <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <h2 className="text-lg font-black text-foreground">جاري تجهيز المستند للطباعة بدقة عالية...</h2>
              <p className="text-muted-foreground text-xs mt-1 font-bold">يرجى الانتظار، جاري تحضير الصفحات</p>
            </div>
          )}

          {/* Edit Mode Notification Banner (Dismissible, elegant, NOT floating on document) */}
          {editMode && (
            <div className="w-full max-w-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-2xl mb-4 text-xs font-extrabold flex items-center justify-between shrink-0 animate-in fade-in print:hidden">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>وضع التحرير المباشر مفعل: اضغط على أي نص أو عنوان بالورقة لتعديله قبل الطباعة.</span>
              </div>
              <button 
                type="button" 
                onClick={() => setEditMode(false)}
                className="text-[11px] underline hover:no-underline font-bold"
              >
                إنهاء
              </button>
            </div>
          )}

          {/* Large Dataset Preview Limit Note */}
          {!showAllForPrint && filteredData.length > previewLimit && (
            <div className="w-full max-w-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-2xl mb-4 text-xs font-bold flex items-center justify-between shrink-0 print:hidden">
              <span>
                يتم عرض أول {previewLimit} سجل لتسريع المعاينة (سيتم طباعة كامل الـ {filteredData.length} سجل عند الضغط على طباعة).
              </span>
              <button 
                type="button"
                onClick={() => setPreviewLimit(p => p + 100)}
                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shrink-0"
              >
                +100 إضافي
              </button>
            </div>
          )}

          {/* SCALED PAPER CONTAINER */}
          <div 
            style={{ 
              transform: editMode ? 'none' : `scale(${zoom})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="transition-all print-engine-scale"
          >
            <div 
              className={`bg-white text-slate-900 shadow-2xl print:shadow-none transition-all relative print-paper-canvas rounded-sm ${
                paperOrientation === 'landscape' ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'
              } ${marginMap[marginSize]} ${pageFrame ? 'ring-4 ring-offset-4 ring-offset-white' : ''}`}
              style={{
                fontFamily: fontFamily === 'sans' ? 'sans-serif' : fontFamily === 'serif' ? 'serif' : fontFamily === 'mono' ? 'monospace' : 'Cairo, sans-serif',
                color: textColor,
                ...(pageFrame && { outlineStyle: pageFrameStyle, outlineColor: tableBorderColor, outlineWidth: '4px' })
              }}
            >
              {/* =========================================================
                  OFFICIAL ROYAL DOCUMENT HEADER
                  ========================================================= */}
              {showHeader && (
                <div 
                  className="mb-6 flex items-center justify-between border-b-2 pb-4 print-header-grid" 
                  style={{ borderColor: tableBorderColor }}
                >
                  {/* Right Header: Kingdom / Ministry info */}
                  <div className="flex items-center gap-3.5 text-right print-header-col-right shrink-0">
                    <div 
                      className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center overflow-hidden bg-slate-50 text-muted-foreground shadow-xs shrink-0" 
                      style={{ borderColor: tableBorderColor }}
                    >
                      <ImageIcon className="w-7 h-7 text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <EditableText tagName="h1" value="المملكة العربية السعودية" className="text-xs font-bold whitespace-nowrap" />
                      <EditableText tagName="h2" value="وزارة التعليم" className="text-xs font-bold text-slate-700 whitespace-nowrap" />
                      <EditableText tagName="h3" value="إدارة التعليم بالمنطقة" className="text-[11px] font-semibold text-slate-600 whitespace-nowrap" />
                      <EditableText tagName="h4" value="مدرسة التقدم الأهلية" className="text-xs font-black text-primary whitespace-nowrap" />
                    </div>
                  </div>

                  {/* Center Header: Document Title & Subtitle */}
                  <div className="text-center px-4 flex-1 print-header-col-center">
                    <EditableText 
                      tagName="h2" 
                      value={customTitle} 
                      onChange={setCustomTitle} 
                      className="text-2xl font-black mb-1 hover:bg-slate-100/80 rounded-xl p-1 inline-block" 
                      style={{ color: titleColor }} 
                    />
                    <EditableText 
                      tagName="p" 
                      value={customSubtitle || "تقرير رسمي معتمد ومحدث من قاعدة البيانات"} 
                      onChange={setCustomSubtitle} 
                      className="text-xs font-bold text-slate-600 hover:bg-slate-100/80 rounded-lg p-0.5 block" 
                    />
                  </div>

                  {/* Left Header: Date & Official Serial */}
                  <div className="text-left space-y-1 text-xs print-header-col-left shrink-0">
                    <div className="flex gap-2 justify-end">
                      <span className="font-bold text-slate-700">التاريخ:</span>
                      <EditableText tagName="span" value={new Date().toISOString().slice(0, 10)} className="font-bold tabular-nums" isNumeric />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <span className="font-bold text-slate-700">رقم السجل:</span>
                      <EditableText tagName="span" value={`DOC-${new Date().getFullYear()}-0${filteredData.length}`} className="font-mono font-bold tabular-nums" isNumeric />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <span className="font-bold text-slate-700">عدد السجلات:</span>
                      <span className="font-bold tabular-nums text-primary">{filteredData.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  TEMPLATE TYPE 1: ROSTER / DATA TABLE
                  ========================================================= */}
              {currentTemplateObj?.type === "table" && (
                <div className="w-full">
                  <table className="w-full text-right border-collapse" style={{ ...tableBorderStyleObj }}>
                    <thead style={{ display: 'table-header-group' }}>
                      <tr>
                        {showPageNumbers && (
                          <th 
                            className="p-2 border font-bold w-12 text-center text-xs" 
                            style={{ backgroundColor: headerBackgroundColor, color: headerTextColor, ...tableBorderStyleObj }}
                          >
                            #
                          </th>
                        )}
                        {currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).map(col => {
                          const isPhoneOrCode = isCodeOrPhone(col.key, col.label);
                          return (
                            <th 
                              key={col.key} 
                              className={`p-2.5 border font-extrabold text-xs transition-colors ${
                                isPhoneOrCode ? "text-center whitespace-nowrap" : "text-right whitespace-nowrap"
                              }`} 
                              style={{ backgroundColor: headerBackgroundColor, color: headerTextColor, ...tableBorderStyleObj }}
                            >
                              <EditableText 
                                tagName="div" 
                                value={customHeaders[col.key] || col.label} 
                                onChange={(val: string) => setCustomHeaders(prev => ({ ...prev, [col.key]: val }))}
                                className={`w-full font-black ${isPhoneOrCode ? "text-center" : "text-right"}`}
                              />
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className={fontMap[dataFontSize]}>
                      {previewData.map((row, idx) => (
                        <tr 
                          key={idx} 
                          style={{ 
                            backgroundColor: idx % 2 === 0 ? 'transparent' : stripeColor, 
                            pageBreakInside: 'avoid' 
                          }}
                        >
                          {showPageNumbers && (
                            <td 
                              className="p-2 border text-center font-bold text-xs tabular-nums text-slate-600" 
                              style={{ ...tableBorderStyleObj }}
                            >
                              {idx + 1}
                            </td>
                          )}
                          {currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).map(col => {
                            const rawValue = col.render ? col.render(row) : row[col.key] ?? "-";
                            const isCodePhone = isCodeOrPhone(col.key, col.label);

                            return (
                              <td 
                                key={col.key} 
                                className={`p-2.5 border ${
                                  isCodePhone ? "text-center whitespace-nowrap" : "text-right"
                                }`} 
                                style={{ ...tableBorderStyleObj }}
                              >
                                {editMode && !showAllForPrint ? (
                                  <EditableText 
                                    tagName="div" 
                                    value={rawValue} 
                                    isNumeric={isCodePhone}
                                    className={`w-full font-bold ${isCodePhone ? "text-center font-mono tabular-nums" : "text-right"}`} 
                                  />
                                ) : (
                                  <div 
                                    className={`w-full font-bold ${
                                      isCodePhone ? "text-center font-mono tabular-nums" : "text-right"
                                    }`}
                                    dir={isCodePhone ? "ltr" : "rtl"}
                                  >
                                    {React.isValidElement(rawValue) ? rawValue : (rawValue !== undefined && rawValue !== null ? String(rawValue) : "-")}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Extra empty rows if requested */}
                      {Array.from({ length: extraEmptyRows }).map((_, idx) => (
                        <tr key={`empty-${idx}`}>
                          {showPageNumbers && (
                            <td className="p-2 border text-center text-xs text-slate-400" style={tableBorderStyleObj}>
                              {previewData.length + idx + 1}
                            </td>
                          )}
                          {currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).map(col => (
                            <td key={col.key} className="p-2 border h-9" style={tableBorderStyleObj}>
                              &nbsp;
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* =========================================================
                  TEMPLATE TYPE 2: HIGH-END STUDENT ID CARDS
                  ========================================================= */}
              {currentTemplateObj?.type === "cards" && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                  {previewData.map((row, idx) => (
                    <div 
                      key={idx} 
                      className="rounded-3xl border-2 shadow-md flex flex-col bg-white overflow-hidden break-inside-avoid relative" 
                      style={{ borderColor: tableBorderColor, ...tableBorderStyleObj }}
                    >
                      {/* Card Header */}
                      <div 
                        className="p-3.5 text-center border-b flex items-center justify-between" 
                        style={{ backgroundColor: headerBackgroundColor, borderColor: tableBorderColor }}
                      >
                        <div className="text-right">
                          <div className="text-[10px] font-black" style={{ color: headerTextColor }}>مدرسة التقدم الأهلية</div>
                          <div className="text-[9px] font-bold opacity-75" style={{ color: headerTextColor }}>بطاقة تعريفية للطالب</div>
                        </div>
                        <div className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs">
                          {row.name ? row.name.substring(0, 1) : "ط"}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 text-primary border-2 border-primary/30 flex items-center justify-center font-black text-xl shadow-xs">
                          {row.name ? row.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("") : "طالب"}
                        </div>

                        <div>
                          <div className="font-extrabold text-sm text-foreground">
                            {row.name || row.studentName || row.id}
                          </div>
                          <div className="text-xs font-bold text-primary mt-0.5">
                            {row.grade || "المرحلة الدراسية"} {row.sectionId && `• شعبة ${globalStore.activeStageSections.find(x => x.id === row.sectionId)?.name || row.sectionId}`}
                          </div>
                        </div>

                        <div className="w-full border-t border-border/60 pt-2.5 space-y-1.5 text-xs text-right">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground font-semibold">رقم القيد:</span>
                            <span className="font-mono font-bold tabular-nums text-foreground">{row.id || "-"}</span>
                          </div>
                          {row.nationalId && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground font-semibold">الهوية:</span>
                              <span className="font-mono font-bold tabular-nums text-foreground">{row.nationalId}</span>
                            </div>
                          )}
                          {row.guardianPhone && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground font-semibold">رقم الطوارئ:</span>
                              <span className="font-mono font-bold tabular-nums text-foreground" dir="ltr">{row.guardianPhone}</span>
                            </div>
                          )}
                        </div>

                        {/* Card QR */}
                        <div className="mt-2 pt-2 border-t border-border/40 w-full flex items-center justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground">العام الدراسي الحالي</span>
                          <QRCode value={getQrValue(row)} size={48} level="L" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* =========================================================
                  TEMPLATE TYPE 3: ROYAL CERTIFICATE OF HONOR
                  ========================================================= */}
              {currentTemplateObj?.type === "certificate" && (
                <div className="space-y-8 flex flex-col items-center justify-center">
                  {previewData.map((row, idx) => (
                    <div 
                      key={idx} 
                      className="relative w-full p-16 text-center border-[12px] bg-white shadow-xl break-inside-avoid mb-8 rounded-2xl" 
                      style={{ 
                        borderColor: headerBackgroundColor, 
                        borderStyle: tableBorderStyle === 'none' ? 'solid' : tableBorderStyle 
                      }}
                    >
                      <div 
                        className="absolute inset-2 border-4 border-dashed pointer-events-none rounded-xl" 
                        style={{ borderColor: tableBorderColor, opacity: 0.4 }} 
                      />
                      <div className="relative z-10 flex flex-col items-center gap-8">
                        <div className="flex items-center justify-center gap-4 text-amber-500">
                          <Award className="w-20 h-20" />
                        </div>
                        <div className="space-y-3">
                          <EditableText tagName="h1" className="text-5xl font-black tracking-tight" style={{ color: titleColor }} value="شهادة شكر وتقدير وتفوق" />
                          <EditableText tagName="p" className="text-lg font-bold text-slate-600" value="تتشرف إدارة مدرسة التقدم الأهلية بمنح هذه الشهادة المعتمدة للطالب/ة:" />
                        </div>
                        <EditableText 
                          tagName="h2" 
                          className="text-4xl font-black border-b-4 pb-3 px-12 rounded-xl text-primary" 
                          style={{ borderColor: tableBorderColor }} 
                          value={row.name || row[currentTemplateObj.columns?.[0]?.key || "id"]} 
                        />
                        <EditableText 
                          tagName="p" 
                          className="text-lg font-medium max-w-2xl leading-relaxed text-slate-700" 
                          value="تقديراً لجهوده المتميزة وتفوقه الأكاديمي وانضباطه السلوكي المشرف خلال العام الدراسي، متمنين له دوام العطاء والازدهار." 
                        />
                        
                        <div className="grid grid-cols-2 gap-24 mt-12 w-full px-12">
                          <div className="flex flex-col items-center gap-3">
                            <EditableText tagName="span" className="font-bold text-base" value={sig1Label} onChange={setSig1Label} />
                            <div className="w-48 border-b-2" style={{ borderColor: tableBorderColor }} />
                          </div>
                          <div className="flex flex-col items-center gap-3">
                            <EditableText tagName="span" className="font-bold text-base" value={sig3Label} onChange={setSig3Label} />
                            <div className="w-48 border-b-2" style={{ borderColor: tableBorderColor }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* =========================================================
                  TEMPLATE TYPE 4: OFFICIAL PAYMENT RECEIPT VOUCHER
                  ========================================================= */}
              {currentTemplateObj?.type === "receipt" && (
                <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
                  {previewData.map((row, idx) => (
                    <div 
                      key={idx} 
                      className="border-2 p-8 bg-white break-inside-avoid relative shadow-md rounded-3xl" 
                      style={{ borderColor: tableBorderColor, borderStyle: tableBorderStyle === 'none' ? 'solid' : tableBorderStyle }}
                    >
                      <div className="flex justify-between items-start mb-6 border-b-2 pb-4" style={{ borderColor: tableBorderColor }}>
                        <div>
                          <EditableText tagName="h2" className="text-2xl font-black mb-1 text-primary" value="سند قبض مالي رسمي" />
                          <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                            <span className="font-bold">رقم السند:</span> 
                            <EditableText tagName="span" className="font-mono font-bold tabular-nums text-foreground" value={row.id || `REC-${1000+idx}`} isNumeric />
                          </div>
                        </div>
                        {showQrCode && <QRCode value={getQrValue(row)} size={64} level="L" />}
                      </div>
                      
                      <div className="space-y-5">
                        <div className="flex justify-between items-center bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                          <span className="font-extrabold text-sm text-emerald-800">المبلغ المستلم نقداً/إلكترونياً:</span>
                          <EditableText tagName="span" className="text-3xl font-black text-emerald-600 tabular-nums" value={`${row.amount || row.net || "0.00"} ر.س`} isNumeric />
                        </div>
                        
                        <div className="grid grid-cols-[130px_1fr] gap-4 items-center text-sm">
                          <span className="font-bold text-muted-foreground">استلمنا من السيد/ة:</span>
                          <EditableText tagName="div" className="border-b border-dashed pb-1 font-bold text-foreground" style={{ borderColor: tableBorderColor }} value={row.name || row.studentName || row.guardianName || ""} />
                          
                          <span className="font-bold text-muted-foreground">وذلك لقاء:</span>
                          <EditableText tagName="div" className="border-b border-dashed pb-1 font-bold text-foreground" style={{ borderColor: tableBorderColor }} value={row.description || customOptions['receiptReason'] || "رسوم دراسية وفواتير معتمدة"} />
                          
                          <span className="font-bold text-muted-foreground">تاريخ الاستحقاق:</span>
                          <EditableText tagName="div" className="border-b border-dashed pb-1 font-bold tabular-nums text-foreground" style={{ borderColor: tableBorderColor }} value={row.date || new Date().toLocaleDateString('ar-EG')} isNumeric />
                        </div>
                      </div>

                      <div className="flex justify-between mt-10 pt-6 border-t-2 border-dashed" style={{ borderColor: tableBorderColor }}>
                        <div className="text-center">
                          <EditableText tagName="p" className="font-bold text-xs mb-8" value="توقيع أمين الصندوق / المحاسب" />
                          <div className="w-36 border-b-2 mx-auto" style={{ borderColor: tableBorderColor }} />
                        </div>
                        <div className="text-center">
                          <EditableText tagName="p" className="font-bold text-xs mb-8" value="الختم الرسمي للمدرسة" />
                          <div className="w-24 h-12 border-2 border-dashed rounded-full mx-auto opacity-30 flex items-center justify-center text-[10px] font-bold" style={{ borderColor: tableBorderColor }}>
                            معتمد
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* =========================================================
                  CUSTOM DOCUMENT TEMPLATE
                  ========================================================= */}
              {currentTemplateObj?.type === "document" && currentTemplateObj.renderDocument && (
                <div className="w-full flex flex-col">
                  {previewData.map((row, idx) => (
                    <div key={idx} className="w-full print:break-after-page border-b-4 print:border-b-0 border-dashed border-primary/20 pb-12 mb-12 print:mb-0 print:pb-0 last:border-b-0 last:mb-0 last:pb-0 relative">
                      {currentTemplateObj.renderDocument?.({ ...{ hiddenColumns, fontSize: dataFontSize, stripeRows: true, extraEmptyRows, showHeader, showSignatures, customNote, customOptions, themePreset } }, [row])}
                      
                      {showQrCode && (
                        <div className="absolute bottom-4 left-4 print:fixed print:bottom-8 print:left-8">
                           <QRCode value={getQrValue(row)} size={60} level="L" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* =========================================================
                  OFFICIAL FOOTER SIGNATURES
                  ========================================================= */}
              {showSignatures && currentTemplateObj?.type === "table" && (
                <div className="mt-12 flex justify-between px-6 pb-6">
                  <div className="text-center">
                    <EditableText tagName="p" className="font-bold text-xs mb-7 text-slate-700" value={sig1Label} onChange={setSig1Label} />
                    <div className="w-40 border-b-2" style={{ borderColor: tableBorderColor }} />
                  </div>
                  <div className="text-center">
                    <EditableText tagName="p" className="font-bold text-xs mb-7 text-slate-700" value={sig2Label} onChange={setSig2Label} />
                    <div className="w-40 border-b-2" style={{ borderColor: tableBorderColor }} />
                  </div>
                  <div className="text-center">
                    <EditableText tagName="p" className="font-bold text-xs mb-7 text-slate-700" value={sig3Label} onChange={setSig3Label} />
                    <div className="w-40 border-b-2" style={{ borderColor: tableBorderColor }} />
                  </div>
                </div>
              )}

              {/* QR Footer */}
              {showQrCode && currentTemplateObj?.type === "table" && (
                <div className="mt-6 flex justify-center pb-6 print:fixed print:bottom-6 print:left-1/2 print:-translate-x-1/2">
                   <QRCode value={qrCodeData} size={70} level="L" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT: LUXURY SETTINGS DRAWER (Collapsible)
            ========================================================= */}
        {sidebarOpen && (
          <aside className="w-[380px] bg-card border-s border-border/80 flex flex-col print:hidden shadow-2xl z-20 shrink-0 animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-border/80 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <h3 className="font-extrabold text-xs text-foreground">خيارات وتخصيص الكشف</h3>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {filteredData.length} سجل جاهز
              </span>
            </div>

            {/* Scrollable Settings Accordions */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
              
              {/* ACCORDION 1: Templates */}
              <Accordion title="قوالب الطباعة المتاحة" icon={LayoutTemplate} badge={templates.length} defaultOpen={true}>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat} className="space-y-1.5">
                      <div className="text-[10px] font-black text-muted-foreground uppercase">{cat}</div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {templates.filter(t => t.category === cat).map(t => {
                          const isSelected = selectedTemplate === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setSelectedTemplate(t.id)}
                              className={`w-full text-right p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between ${
                                isSelected 
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm glow-primary scale-[1.01]" 
                                  : "bg-background border-border/70 hover:bg-accent text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-muted text-primary"}`}>
                                  {t.type === 'cards' ? <LayoutGrid className="w-3.5 h-3.5" /> :
                                   t.type === 'certificate' ? <Award className="w-3.5 h-3.5" /> :
                                   t.type === 'receipt' ? <FileText className="w-3.5 h-3.5" /> :
                                   <LayoutTemplate className="w-3.5 h-3.5" />}
                                </div>
                                <div className="truncate">
                                  <div className="font-extrabold truncate">{t.name}</div>
                                  {t.description && (
                                    <div className={`text-[10px] truncate ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                                      {t.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion>

              {/* ACCORDION 2: Column Selection */}
              {currentTemplateObj?.type === "table" && (
                <Accordion 
                  title="أعمدة الكشف (إخفاء / إظهار)" 
                  icon={Columns} 
                  badge={`${currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).length} عمود`}
                  defaultOpen={false}
                >
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allVisible: Record<string, boolean> = {};
                          currentTemplateObj.columns?.forEach(c => { allVisible[c.key] = false; });
                          setHiddenColumns(allVisible);
                        }}
                        className="flex-1 py-1 rounded-lg text-[11px] font-bold bg-muted hover:bg-accent text-foreground transition-colors"
                      >
                        إظهار الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allHidden: Record<string, boolean> = {};
                          currentTemplateObj.columns?.forEach(c => { allHidden[c.key] = true; });
                          setHiddenColumns(allHidden);
                        }}
                        className="flex-1 py-1 rounded-lg text-[11px] font-bold bg-muted hover:bg-accent text-foreground transition-colors"
                      >
                        إخفاء الكل
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {currentTemplateObj.columns?.map(col => {
                        const isChecked = !hiddenColumns[col.key];
                        return (
                          <label 
                            key={col.key} 
                            className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold cursor-pointer transition-colors border ${
                              isChecked 
                                ? "bg-primary/5 border-primary/20 text-foreground" 
                                : "bg-muted/20 border-transparent text-muted-foreground line-through opacity-60"
                            }`}
                          >
                            <span>{col.label}</span>
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => toggleColumn(col.key)}
                              className="accent-primary w-4 h-4 rounded"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </Accordion>
              )}

              {/* ACCORDION 3: Ready Themes */}
              <Accordion title="الثيمات والتنسيق المالي" icon={PenTool} defaultOpen={false}>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setThemePreset("official")} 
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                      themePreset === "official" ? "border-primary bg-primary/10 shadow-xs" : "border-border/60 hover:bg-muted/30"
                    }`}
                  >
                    <div className="w-full h-6 bg-slate-100 rounded border border-slate-300 flex items-center justify-center">
                      <div className="w-3/4 h-1.5 bg-slate-400 rounded-full" />
                    </div>
                    <span className="text-xs font-extrabold">رسمي معتمد</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setThemePreset("modern")} 
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                      themePreset === "modern" ? "border-primary bg-primary/10 shadow-xs" : "border-border/60 hover:bg-muted/30"
                    }`}
                  >
                    <div className="w-full h-6 bg-blue-50 rounded border border-blue-200 flex items-center justify-center">
                      <div className="w-3/4 h-1.5 bg-blue-500 rounded-full" />
                    </div>
                    <span className="text-xs font-extrabold">عصري أزرق</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setThemePreset("classic")} 
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                      themePreset === "classic" ? "border-primary bg-primary/10 shadow-xs" : "border-border/60 hover:bg-muted/30"
                    }`}
                  >
                    <div className="w-full h-6 bg-white rounded border border-black flex items-center justify-center">
                      <div className="w-3/4 h-1.5 bg-black rounded-full" />
                    </div>
                    <span className="text-xs font-extrabold">أبيض وأسود</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setThemePreset("elegant")} 
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                      themePreset === "elegant" ? "border-primary bg-primary/10 shadow-xs" : "border-border/60 hover:bg-muted/30"
                    }`}
                  >
                    <div className="w-full h-6 bg-amber-50 rounded border border-amber-300 flex items-center justify-center">
                      <div className="w-3/4 h-1.5 bg-indigo-600 rounded-full" />
                    </div>
                    <span className="text-xs font-extrabold">ملكي فاخر</span>
                  </button>
                </div>
              </Accordion>

              {/* ACCORDION 4: Page & Margins */}
              <Accordion title="إعدادات الصفحة والترويسة" icon={FileText} defaultOpen={false}>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">حجم الهوامش:</span>
                    <select 
                      value={marginSize} 
                      onChange={e => setMarginSize(e.target.value as any)} 
                      className="border border-input rounded-xl px-2.5 py-1 text-xs font-bold outline-none bg-background text-foreground"
                    >
                      <option value="none">بدون هوامش</option>
                      <option value="sm">ضيقة (0.8 سم)</option>
                      <option value="md">متوسطة (1.2 سم)</option>
                      <option value="lg">واسعة (2.0 سم)</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">حجم خط البيانات:</span>
                    <select 
                      value={dataFontSize} 
                      onChange={e => setDataFontSize(e.target.value as any)} 
                      className="border border-input rounded-xl px-2.5 py-1 text-xs font-bold outline-none bg-background text-foreground"
                    >
                      <option value="xs">صغير جداً (11px)</option>
                      <option value="sm">افتراضي (12px)</option>
                      <option value="base">متوسط (14px)</option>
                      <option value="lg">كبير (16px)</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">إظهار الترويسة المعتمدة:</span>
                    <input 
                      type="checkbox" 
                      checked={showHeader} 
                      onChange={e => setShowHeader(e.target.checked)} 
                      className="accent-primary w-4 h-4 rounded cursor-pointer" 
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">إطار زخرفي للورقة:</span>
                    <input 
                      type="checkbox" 
                      checked={pageFrame} 
                      onChange={e => setPageFrame(e.target.checked)} 
                      className="accent-primary w-4 h-4 rounded cursor-pointer" 
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">أسطر فارغة إضافية:</span>
                    <input 
                      type="number" 
                      min="0" 
                      max="20" 
                      value={extraEmptyRows} 
                      onChange={e => setExtraEmptyRows(parseInt(e.target.value) || 0)} 
                      className="w-16 border border-input rounded-xl px-2 py-1 text-xs font-bold outline-none bg-background text-center tabular-nums" 
                    />
                  </div>
                </div>
              </Accordion>

              {/* ACCORDION 5: Signatures & Certification */}
              <Accordion title="التوقيعات والاعتماد الرسمي" icon={BadgeCheck} defaultOpen={false}>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">تفعيل التوقيعات أسفل الصفحة:</span>
                    <input 
                      type="checkbox" 
                      checked={showSignatures} 
                      onChange={e => setShowSignatures(e.target.checked)} 
                      className="accent-primary w-4 h-4 rounded cursor-pointer" 
                    />
                  </div>

                  {showSignatures && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1">الموقع الأول:</label>
                        <input 
                          type="text" 
                          value={sig1Label} 
                          onChange={e => setSig1Label(e.target.value)} 
                          className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1">الموقع الثاني:</label>
                        <input 
                          type="text" 
                          value={sig2Label} 
                          onChange={e => setSig2Label(e.target.value)} 
                          className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1">الموقع الثالث (الاعتماد النهائي):</label>
                        <input 
                          type="text" 
                          value={sig3Label} 
                          onChange={e => setSig3Label(e.target.value)} 
                          className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-border/50">
                    <span className="font-bold text-foreground">رمز التحقق الذكي (QR):</span>
                    <input 
                      type="checkbox" 
                      checked={showQrCode} 
                      onChange={e => setShowQrCode(e.target.checked)} 
                      className="accent-primary w-4 h-4 rounded cursor-pointer" 
                    />
                  </div>
                </div>
              </Accordion>

              {/* ACCORDION 6: Quick Data Filter */}
              {(availableGrades.length > 0 || availableSections.length > 0) && (
                <Accordion title="تصفية الصفوف والشعب" icon={Filter} defaultOpen={false}>
                  <div className="space-y-3 text-xs">
                    {availableGrades.length > 0 && (
                      <div>
                        <div className="font-bold text-[11px] text-muted-foreground mb-1.5">حسب الصف:</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {availableGrades.map(g => (
                            <label key={g} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={selectedGrades.has(g)} 
                                onChange={() => {
                                  const next = new Set(selectedGrades);
                                  if (next.has(g)) next.delete(g); else next.add(g);
                                  setSelectedGrades(next);
                                }} 
                                className="accent-primary w-4 h-4 rounded" 
                              />
                              <span className="font-bold truncate">{g}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableSections.length > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="font-bold text-[11px] text-muted-foreground mb-1.5">حسب الشعبة:</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {availableSections.map(s => {
                            const secName = globalStore.activeStageSections.find(x => x.id === s)?.name || s;
                            return (
                              <label key={s} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={selectedSections.has(s)} 
                                  onChange={() => {
                                    const next = new Set(selectedSections);
                                    if (next.has(s)) next.delete(s); else next.add(s);
                                    setSelectedSections(next);
                                  }} 
                                  className="accent-primary w-4 h-4 rounded" 
                                />
                                <span className="font-bold truncate">شعبة {secName}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Accordion>
              )}

              {/* ACCORDION 7: Export Files */}
              <Accordion title="خيارات التصدير الرقمي" icon={Download} defaultOpen={false}>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => handleExport('csv')} 
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>إكسيل (CSV)</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleExport('html')} 
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-colors"
                  >
                    <LayoutTemplate className="w-4 h-4" />
                    <span>صفحة ويب (HTML)</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleExport('json')} 
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-colors"
                  >
                    <Code className="w-4 h-4" />
                    <span>بيانات (JSON)</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleExport('txt')} 
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-border/80 bg-muted/40 text-foreground hover:bg-muted text-xs font-bold transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>نص خام (TXT)</span>
                  </button>
                </div>
              </Accordion>

            </div>

            {/* Sticky Drawer Bottom CTA */}
            <div className="p-4 border-t border-border/80 bg-card/95">
              <button 
                type="button"
                onClick={handlePrint} 
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-xs font-black shadow-lg hover:bg-primary/90 transition-all glow-primary active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة المستند الآن (Ctrl + P)</span>
              </button>
            </div>

          </aside>
        )}

      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
