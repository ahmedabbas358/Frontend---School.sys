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
  Check, 
  Sparkles, 
  Columns, 
  PenTool, 
  BadgeCheck, 
  PanelRightClose,
  PanelRightOpen,
  ArrowRight,
  ArrowRightLeft,
  Search,
  Filter,
  FileSpreadsheet,
  Code,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Sliders,
  SlidersHorizontal,
  Table as TableIcon,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Eye,
  EyeOff,
  CheckCircle2,
  FileCheck,
  Building2,
  Calendar,
  Hash,
  Share2,
  Copy,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Square,
  CheckSquare,
  HelpCircle,
  ShieldCheck,
  Grid
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
  align?: "right" | "center" | "left";
  width?: string;
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

// Collapsible Accordion Box
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
        className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors text-right select-none cursor-pointer"
      >
        <div className="flex items-center gap-2 font-bold text-xs text-foreground min-w-0">
          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">{title}</span>
          {badge !== undefined && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
              {badge}
            </span>
          )}
        </div>
        <div className="text-muted-foreground/60 transition-transform duration-200 shrink-0 mr-1">
          {isOpen ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {isOpen && (
        <div className="p-3 pt-0 border-t border-border/40 bg-background/50 space-y-3 animate-in slide-in-from-top-1 duration-200">
          <div className="pt-2.5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// Editable Text Component with Clean Typography
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

// Horizontal Word-like Ruler Component
function HorizontalRuler({ 
  widthMm, 
  zoom, 
  marginLeftMm = 12, 
  marginRightMm = 12 
}: { 
  widthMm: number; 
  zoom: number; 
  marginLeftMm?: number; 
  marginRightMm?: number; 
}) {
  const totalCm = Math.floor(widthMm / 10);
  const cmMarks = Array.from({ length: totalCm + 1 }, (_, i) => i);

  return (
    <div 
      className="hidden md:flex flex-col select-none border-b border-border/70 bg-muted/40 text-[10px] font-mono text-muted-foreground relative mb-3 rounded-lg overflow-hidden shadow-xs print:hidden"
      style={{ width: `${widthMm * 3.78 * zoom}px`, maxWidth: "100%" }}
    >
      <div className="h-6 flex items-end relative px-2 bg-gradient-to-b from-card/80 to-muted/60">
        {/* Shaded Margins Indicators */}
        <div 
          className="absolute top-0 bottom-0 bg-primary/10 border-e border-primary/30"
          style={{ right: 0, width: `${(marginRightMm / widthMm) * 100}%` }}
          title={`الهامش الأيمن: ${marginRightMm / 10} سم`}
        />
        <div 
          className="absolute top-0 bottom-0 bg-primary/10 border-s border-primary/30"
          style={{ left: 0, width: `${(marginLeftMm / widthMm) * 100}%` }}
          title={`الهامش الأيسر: ${marginLeftMm / 10} سم`}
        />

        {/* Ruler Centimeter Marks */}
        <div className="w-full flex justify-between items-end relative z-10">
          {cmMarks.map(cm => (
            <div key={cm} className="flex flex-col items-center flex-1 relative">
              <span className="text-[9px] font-bold text-muted-foreground/80 mb-0.5">{cm}</span>
              <div className="w-px h-2 bg-border/80" />
            </div>
          ))}
        </div>
      </div>
    </div>
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
  
  // Basic & Navigation State
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplateId || templates[0]?.id || "");
  const [editMode, setEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ribbonExpanded, setRibbonExpanded] = useState(true);
  const [activeRibbonTab, setActiveRibbonTab] = useState<"layout" | "table" | "typography" | "data" | "columns" | "signatures" | "export">("layout");

  // View Mode: Pages (A4 discrete sheets) | Single Page | Sheet (Excel continuous grid)
  const [viewMode, setViewMode] = useState<"pages" | "single" | "sheet">("pages");

  // Custom text states that override default props
  const [customTitle, setCustomTitle] = useState(effectiveTitle);
  const [customSubtitle, setCustomSubtitle] = useState(subtitle || "");
  const [customNote, setCustomNote] = useState("");
  const [customOptions, setCustomOptions] = useState<Record<string, any>>({});
  
  // Custom School & Ministry Headers
  const [schoolName, setSchoolName] = useState("مدرسة التقدم الأهلية");
  const [educationDept, setEducationDept] = useState("إدارة التعليم بالمنطقة");
  const [watermarkText, setWatermarkText] = useState("");

  // Column overrides & Visibility
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({});
  const [columnAlignments, setColumnAlignments] = useState<Record<string, "right" | "center" | "left">>({});
  const [columnSearch, setColumnSearch] = useState("");

  // Live Zoom State
  const [zoom, setZoom] = useState(0.85);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Data Filtering & Search
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set());
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [qrType, setQrType] = useState<"url" | "data" | "id">("url");

  // Page Settings (Word Page Setup)
  const [paperOrientation, setPaperOrientation] = useState<"portrait" | "landscape">("portrait");
  const [paperSize, setPaperSize] = useState<"A4" | "A3" | "Letter">("A4");
  const [marginPreset, setMarginPreset] = useState<"none" | "narrow" | "normal" | "wide">("normal");
  const [printBackgrounds, setPrintBackgrounds] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [pageFrame, setPageFrame] = useState(false);
  const [pageFrameStyle, setPageFrameStyle] = useState<"solid" | "double" | "dashed">("solid");

  // Table Formatting (Excel Grid & Styling)
  const [themePreset, setThemePreset] = useState<"official" | "royal" | "emerald" | "classic" | "amber">("official");
  const [tableGridStyle, setTableGridStyle] = useState<"full" | "horizontal" | "outer" | "minimal">("full");
  const [tableBorderWidth, setTableBorderWidth] = useState<"1px" | "2px">("1px");
  const [tableBorderColor, setTableBorderColor] = useState("#cbd5e1");
  const [headerBackgroundColor, setHeaderBackgroundColor] = useState("#f1f5f9");
  const [headerTextColor, setHeaderTextColor] = useState("#0f172a");
  const [stripeColor, setStripeColor] = useState("#f8fafc");
  const [enableZebra, setEnableZebra] = useState(true);
  const [extraEmptyRows, setExtraEmptyRows] = useState(0);
  const [freezeHeaderInPreview, setFreezeHeaderInPreview] = useState(true);
  const [showSummaryStats, setShowSummaryStats] = useState(true);

  // Typography
  const [fontFamily, setFontFamily] = useState<"cairo" | "tajawal" | "naskh" | "sans" | "mono">("cairo");
  const [dataFontSize, setDataFontSize] = useState<10 | 11 | 12 | 13 | 14 | 16>(12);
  const [textColor, setTextColor] = useState("#0f172a");
  const [titleColor, setTitleColor] = useState("#0f172a");

  // Content Controls
  const [showHeader, setShowHeader] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [signaturesPlacement, setSignaturesPlacement] = useState<"last_page" | "all_pages">("last_page");
  const [sig1Label, setSig1Label] = useState("المراجعة والتدقيق");
  const [sig2Label, setSig2Label] = useState("شؤون الطلاب");
  const [sig3Label, setSig3Label] = useState("مدير المدرسة المعتمد");
  
  // Advanced & QR
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("https://school.sa/verify");

  // Performance and Print
  const [previewLimit, setPreviewLimit] = useState(100);
  const [showAllForPrint, setShowAllForPrint] = useState(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printScope, setPrintScope] = useState<"all" | "page1" | "50" | "100">("all");

  // A4 Multi-Page Chunking & Density Engine
  const [a4PaginationEnabled, setA4PaginationEnabled] = useState(true);
  const [a4RowsPerPage, setA4RowsPerPage] = useState(25);
  const [a4CurrentSheet, setA4CurrentSheet] = useState(1);

  // Auto-Enrichment from Global Store
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

  // Sync rows initially
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

  // Adjust rows per page default when orientation changes
  useEffect(() => {
    if (paperOrientation === "landscape") {
      setA4RowsPerPage(prev => (prev === 25 ? 20 : prev));
    } else {
      setA4RowsPerPage(prev => (prev === 20 ? 25 : prev));
    }
  }, [paperOrientation]);

  // Filtered dataset
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

  const printableData = useMemo(() => {
    if (printScope === "page1") return filteredData.slice(0, a4RowsPerPage);
    if (printScope === "50") return filteredData.slice(0, 50);
    if (printScope === "100") return filteredData.slice(0, 100);
    return filteredData;
  }, [filteredData, printScope, a4RowsPerPage]);

  const currentTemplateObj = templates.find(t => t.id === selectedTemplate) || templates[0];

  // A4 Multi-page Chunking
  const tableChunks = useMemo(() => {
    const dataset = showAllForPrint ? printableData : printableData;
    if (!a4PaginationEnabled || currentTemplateObj?.type !== "table") {
      return [dataset];
    }
    const rpp = Math.max(5, a4RowsPerPage || 25);
    const chunks: any[][] = [];
    for (let i = 0; i < dataset.length; i += rpp) {
      chunks.push(dataset.slice(i, i + rpp));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [showAllForPrint, printableData, a4PaginationEnabled, currentTemplateObj?.type, a4RowsPerPage]);

  const totalSheets = tableChunks.length;
  const safeCurrentSheet = Math.min(Math.max(1, a4CurrentSheet), totalSheets || 1);

  // Apply Theme Presets
  useEffect(() => {
    if (themePreset === "official") {
      setFontFamily("cairo");
      setHeaderBackgroundColor("#f1f5f9");
      setHeaderTextColor("#0f172a");
      setTableBorderColor("#cbd5e1");
      setStripeColor("#f8fafc");
      setTextColor("#0f172a");
      setTitleColor("#0f172a");
    } else if (themePreset === "royal") {
      setFontFamily("cairo");
      setHeaderBackgroundColor("#1e3a8a");
      setHeaderTextColor("#ffffff");
      setTableBorderColor("#93c5fd");
      setStripeColor("#f0f7ff");
      setTextColor("#0f172a");
      setTitleColor("#1e3a8a");
    } else if (themePreset === "emerald") {
      setFontFamily("tajawal");
      setHeaderBackgroundColor("#065f46");
      setHeaderTextColor("#ffffff");
      setTableBorderColor("#a7f3d0");
      setStripeColor("#f0fdf4");
      setTextColor("#064e3b");
      setTitleColor("#065f46");
    } else if (themePreset === "classic") {
      setFontFamily("naskh");
      setHeaderBackgroundColor("#ffffff");
      setHeaderTextColor("#000000");
      setTableBorderColor("#000000");
      setStripeColor("#f9fafb");
      setTextColor("#000000");
      setTitleColor("#000000");
    } else if (themePreset === "amber") {
      setFontFamily("cairo");
      setHeaderBackgroundColor("#78350f");
      setHeaderTextColor("#ffffff");
      setTableBorderColor("#fde68a");
      setStripeColor("#fffbeb");
      setTextColor("#451a03");
      setTitleColor("#78350f");
    }
  }, [themePreset]);

  // Sync title when opened
  useEffect(() => {
    if (isOpen) {
      setCustomTitle(effectiveTitle);
      setCustomSubtitle(subtitle || "");
    }
  }, [isOpen, effectiveTitle, subtitle]);

  // Print isolation iframe handler
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

    const marginVal = marginPreset === 'none' ? '0' : marginPreset === 'narrow' ? '0.6cm' : marginPreset === 'normal' ? '1.2cm' : '2.0cm';
    const paperSizeVal = paperSize === 'A3' ? 'A3' : paperSize === 'Letter' ? 'letter' : 'A4';

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
            size: ${paperSizeVal} ${paperOrientation};
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
            min-width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
            outline: none !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .print-paper-canvas:last-child {
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
            box-sizing: border-box !important;
            margin-bottom: 16px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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
            padding: 5px 8px !important;
            vertical-align: middle !important;
            word-break: normal !important;
          }
          .print-hidden, button, header.print-hidden, .ruler-bar {
            display: none !important;
          }
        </style>
      </head>
      <body class="bg-white text-slate-900 font-sans" dir="rtl">
        ${(() => {
          const canvasElements = canvasEl.classList.contains("print-paper-canvas-stack") || canvasEl.id === "print-paper-stack"
            ? Array.from(canvasEl.querySelectorAll(".print-paper-canvas"))
            : [canvasEl];
          return canvasElements.map(el => (el as HTMLElement).outerHTML).join("\n");
        })()}
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
        const stackEl = document.getElementById("print-paper-stack");
        if (stackEl) {
          printCanvasViaIframe(stackEl);
        } else {
          const canvasEl = document.querySelector(".print-paper-canvas") as HTMLElement;
          if (canvasEl) {
            printCanvasViaIframe(canvasEl);
          } else {
            window.print();
            setIsPreparingPrint(false);
          }
        }
      }, 250);
    });
  };

  // Keyboard shortcut Ctrl/Cmd + P and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p" && isOpen) {
        e.preventDefault();
        handlePrint();
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredData, onClose]);

  // Fit to screen calculation
  const handleFitToScreen = () => {
    if (canvasRef.current) {
      const containerWidth = canvasRef.current.clientWidth - (sidebarOpen ? 64 : 48);
      const paperWidthPx = paperOrientation === "landscape" ? 1122 : 794;
      const scale = Math.min(1.15, Math.max(0.45, containerWidth / paperWidthPx));
      setZoom(Math.round(scale * 100) / 100);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(handleFitToScreen, 120);
    }
  }, [isOpen, paperOrientation, sidebarOpen]);

  if (!isOpen) return null;

  // Column operations
  const toggleColumn = (colKey: string) => {
    setHiddenColumns(prev => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  // Quick Export Handlers
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
      const headers = cols.map(c => `<th style="padding:10px;border:1px solid #cbd5e1;background:#f1f5f9;">${customHeaders[c.key] || c.label}</th>`).join('');
      const rows = filteredData.map(row => {
        const rowData = cols.map(col => {
          let val = col.render && typeof col.render(row) === 'string' ? col.render(row) : row[col.key];
          return `<td style="padding:8px;border:1px solid #cbd5e1;">${val || ''}</td>`;
        }).join('');
        return `<tr>${rowData}</tr>`;
      }).join('\n');
      content = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${customTitle}</title><style>body{font-family:Cairo,sans-serif;padding:32px;background:#f8fafc;}table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);}</style></head><body><h2 style="text-align:center;margin-bottom:20px;">${customTitle}</h2><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
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
      URL.revokeObjectURL(url);
    }
  };

  // Determine if a column is numeric/phone/code
  const isCodeOrPhone = (key: string, label: string) => {
    const k = key.toLowerCase();
    const l = label.toLowerCase();
    return (
      k.includes("phone") || k.includes("mobile") || k.includes("tel") || 
      l.includes("جوال") || l.includes("هاتف") ||
      k.includes("id") || k.includes("code") || k.includes("national") ||
      l.includes("قيد") || l.includes("هوية") || l.includes("كود") || l.includes("رمز") ||
      k.includes("rank") || l.includes("ترتيب") || k.includes("percentage") || l.includes("نسبة") ||
      k.includes("total") || l.includes("مجموع") || k.includes("degree") || l.includes("درجة")
    );
  };

  // Font family css mapping
  const fontFamilyCss = 
    fontFamily === "cairo" ? "Cairo, sans-serif" :
    fontFamily === "tajawal" ? "Tajawal, sans-serif" :
    fontFamily === "naskh" ? "'Traditional Arabic', Amiri, serif" :
    fontFamily === "mono" ? "ui-monospace, SFMono-Regular, monospace" :
    "sans-serif";

  // Margins styling
  const marginPaddingCss = 
    marginPreset === "none" ? "p-0" :
    marginPreset === "narrow" ? "p-4 sm:p-5" :
    marginPreset === "normal" ? "p-7 sm:p-8" :
    "p-10 sm:p-12";

  const marginMm = marginPreset === "none" ? 0 : marginPreset === "narrow" ? 6 : marginPreset === "normal" ? 12 : 20;
  const paperWidthMm = paperOrientation === "landscape" ? (paperSize === "A3" ? 420 : 297) : (paperSize === "A3" ? 297 : 210);

  // Border style object
  const tableBorderStyleObj: React.CSSProperties = {
    borderStyle: tableGridStyle === "minimal" ? "none" : "solid",
    borderWidth: tableBorderWidth,
    borderColor: tableBorderColor
  };

  // Template categories
  const categories = Array.from(new Set(templates.map(t => t.category)));

  // Filtered columns for Column Manager
  const activeColumnsList = currentTemplateObj?.columns || [];
  const filteredColumnsList = activeColumnsList.filter(col => 
    col.label.toLowerCase().includes(columnSearch.toLowerCase()) || 
    col.key.toLowerCase().includes(columnSearch.toLowerCase())
  );

  const previewData = showAllForPrint ? printableData : printableData.slice(0, previewLimit);

  // Quick summary statistics for Excel view mode
  const summaryCalculations = useMemo(() => {
    if (!currentTemplateObj?.columns) return {};
    const stats: Record<string, { sum: number; avg: number; count: number; isNumeric: boolean }> = {};
    
    currentTemplateObj.columns.forEach(col => {
      let isNumericCol = true;
      let sum = 0;
      let count = 0;

      for (let i = 0; i < Math.min(filteredData.length, 200); i++) {
        const val = filteredData[i][col.key];
        if (val !== undefined && val !== null && val !== "") {
          const num = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
          if (!isNaN(num)) {
            sum += num;
            count++;
          } else {
            isNumericCol = false;
            break;
          }
        }
      }

      if (isNumericCol && count > 0) {
        stats[col.key] = {
          sum: Math.round(sum * 10) / 10,
          avg: Math.round((sum / count) * 10) / 10,
          count,
          isNumeric: true
        };
      }
    });

    return stats;
  }, [currentTemplateObj?.columns, filteredData]);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/85 backdrop-blur-xl print:bg-white print:block overflow-hidden print-engine-modal" dir="rtl">
      
      {/* =========================================================
          1. TOP INSTITUTIONAL STUDIO COMMAND BAR
          ========================================================= */}
      <header className="h-14 border-b border-border/80 bg-card/95 backdrop-blur-2xl px-4 flex items-center justify-between gap-2 shrink-0 z-40 print:hidden select-none">
        
        {/* Right (RTL Start): Return Back Button & Document Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Prominent Back / Return Button */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background hover:bg-accent text-foreground text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="العودة وإغلاق محرك الطباعة (Esc)"
          >
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">العودة للكشف</span>
            <kbd className="hidden md:inline-block text-[10px] bg-muted/80 px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground font-mono">Esc</kbd>
          </button>

          <div className="w-px h-5 bg-border/60 mx-0.5 hidden sm:block shrink-0" />

          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-700 text-white flex items-center justify-center shadow-md shrink-0">
            <Printer className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-foreground truncate">
                {customTitle}
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 hidden sm:inline">
                {currentTemplateObj?.name || "كشف معتمد"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold truncate hidden lg:block">
              استوديو التقارير والطباعة الهندسية • {filteredData.length} سجل متاح
            </p>
          </div>
        </div>

        {/* Center: View Mode Switcher (Pages | Single | Excel Sheet) */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => setViewMode("pages")}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "pages" 
                ? "bg-primary text-primary-foreground shadow-xs" 
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
            title="تخطيط صفحات A4 متتالية (Word Print Layout)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">صفحات A4</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("single")}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "single" 
                ? "bg-primary text-primary-foreground shadow-xs" 
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
            title="ورقة تلو ورقة (Single Sheet)"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ورقة منفردة</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("sheet")}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "sheet" 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
            title="ورقة عمل إكسل ممتدة مع تجميد رأس الأعمدة (Excel Sheet View)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">ورقة إكسل</span>
          </button>
        </div>

        {/* Left (RTL End): Actions & Toolbar Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Main Print CTA */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer"
            title="طباعة المستند الآن (Ctrl + P)"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden xs:inline">طباعة الآن</span>
          </button>

          {/* Quick Excel Export */}
          <button
            type="button"
            onClick={() => handleExport("csv")}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            title="تصدير سريع إلى ملف إكسيل (CSV)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden md:inline">Excel</span>
          </button>

          {/* Direct Text Edit Mode Toggle */}
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              editMode 
                ? "bg-amber-500 text-white border-amber-600 shadow-xs animate-pulse" 
                : "border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title={editMode ? "إنهاء وضع التحرير المباشر" : "تفعيل التحرير المباشر للنصوص داخل الورقة"}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{editMode ? "إنهاء التحرير" : "تحرير حر"}</span>
          </button>

          {/* Ribbon Bar Toggle */}
          <button
            type="button"
            onClick={() => setRibbonExpanded(!ribbonExpanded)}
            className={`p-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
              ribbonExpanded 
                ? "bg-muted text-foreground border-border/80" 
                : "text-muted-foreground hover:bg-muted border-border/60"
            }`}
            title={ribbonExpanded ? "تصغير شريط الأدوات (Ribbon)" : "توسيع شريط الأدوات (Ribbon)"}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(v => !v)}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              sidebarOpen
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title={sidebarOpen ? "إخفاء لوحة الإعدادات الجانبية" : "إظهار لوحة الإعدادات الجانبية"}
          >
            {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>

          {/* Close Engine Modal */}
          <button 
            type="button"
            onClick={onClose} 
            className="h-8 px-2.5 rounded-xl bg-muted/60 hover:bg-destructive hover:text-white text-muted-foreground text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="إغلاق استوديو الطباعة والعودة (Esc)"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">إغلاق</span>
          </button>
        </div>
      </header>

      {/* =========================================================
          2. OFFICE 365 / WORD & EXCEL TABBED RIBBON TOOLBAR
          ========================================================= */}
      {ribbonExpanded && (
        <div className="bg-card/90 border-b border-border/80 shadow-xs print:hidden z-30 select-none animate-in slide-in-from-top-1 duration-150">
          
          {/* Ribbon Tabs Selector Bar */}
          <div className="flex items-center gap-1 px-4 border-b border-border/50 bg-muted/30 overflow-x-auto no-scrollbar">
            {[
              { id: "layout", label: "تخطيط الصفحة (Word)", icon: LayoutTemplate },
              { id: "table", label: "تنسيق الجدول (Excel)", icon: TableIcon },
              { id: "typography", label: "الخطوط والنصوص", icon: Type },
              { id: "data", label: "البيانات والكثافة", icon: Layers },
              { id: "columns", label: "إدارة الأعمدة", icon: Columns },
              { id: "signatures", label: "الاعتمادات والتواقيع", icon: BadgeCheck },
              { id: "export", label: "التصدير والمشاركة", icon: Download }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeRibbonTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveRibbonTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-black flex items-center gap-1.5 transition-all border-b-2 cursor-pointer shrink-0 ${
                    isActive 
                      ? "border-primary text-primary bg-card" 
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Ribbon Content Panel (Active Tab Controls) */}
          <div className="p-2.5 px-4 overflow-x-auto no-scrollbar">
            
            {/* TAB 1: PAGE LAYOUT (WORD STYLE) */}
            {activeRibbonTab === "layout" && (
              <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
                
                {/* Orientation */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground px-1 font-black">الاتجاه:</span>
                  <button
                    type="button"
                    onClick={() => setPaperOrientation("portrait")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      paperOrientation === "portrait" 
                        ? "bg-primary text-primary-foreground shadow-xs" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    طولي (Portrait)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperOrientation("landscape")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      paperOrientation === "landscape" 
                        ? "bg-primary text-primary-foreground shadow-xs" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    عرضي (Landscape)
                  </button>
                </div>

                {/* Paper Size */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground px-1 font-black">حجم الورقة:</span>
                  {(["A4", "A3", "Letter"] as const).map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setPaperSize(sz)}
                      className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        paperSize === sz 
                          ? "bg-primary text-primary-foreground shadow-xs" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

                {/* Margins Presets */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground px-1 font-black">الهوامش:</span>
                  {[
                    { id: "normal", label: "عادي (1.2سم)" },
                    { id: "narrow", label: "ضيق (0.6سم)" },
                    { id: "wide", label: "عريض (2.0سم)" },
                    { id: "none", label: "بدون" }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMarginPreset(m.id as any)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        marginPreset === m.id 
                          ? "bg-primary text-primary-foreground shadow-xs font-black" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Page Frame & Border */}
                <div className="flex items-center gap-2 bg-muted/60 px-2.5 py-1.5 rounded-xl border border-border/60">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={pageFrame} 
                      onChange={e => setPageFrame(e.target.checked)}
                      className="accent-primary w-3.5 h-3.5 rounded cursor-pointer"
                    />
                    <span className="text-xs font-black text-foreground">إطار زخرفي</span>
                  </label>
                  {pageFrame && (
                    <select
                      value={pageFrameStyle}
                      onChange={e => setPageFrameStyle(e.target.value as any)}
                      className="h-6 rounded border border-border bg-background px-1 text-[10px] font-bold outline-none"
                    >
                      <option value="solid">خط مصمت</option>
                      <option value="double">خط مزدوج</option>
                      <option value="dashed">خط متقطع</option>
                    </select>
                  )}
                </div>

                {/* Show Header & Numbering */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showHeader} 
                      onChange={e => setShowHeader(e.target.checked)}
                      className="accent-primary w-3.5 h-3.5 rounded cursor-pointer"
                    />
                    <span className="text-xs font-black text-foreground">الترويسة الرسمية</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showPageNumbers} 
                      onChange={e => setShowPageNumbers(e.target.checked)}
                      className="accent-primary w-3.5 h-3.5 rounded cursor-pointer"
                    />
                    <span className="text-xs font-black text-foreground">ترقيم الصفحات</span>
                  </label>
                </div>

              </div>
            )}

            {/* TAB 2: TABLE & EXCEL SHEET FORMAT */}
            {activeRibbonTab === "table" && (
              <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
                
                {/* Theme Palette Buttons */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground px-1 font-black">نمط الجدول:</span>
                  {[
                    { id: "official", label: "وزاري رسمي", color: "#f1f5f9" },
                    { id: "royal", label: "كحلي ملكي", color: "#1e3a8a" },
                    { id: "emerald", label: "أخضر أكاديمي", color: "#065f46" },
                    { id: "amber", label: "ذهبي فاخر", color: "#78350f" },
                    { id: "classic", label: "أبيض وأسود", color: "#ffffff" }
                  ].map(th => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setThemePreset(th.id as any)}
                      className={`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        themePreset === th.id 
                          ? "bg-primary text-primary-foreground shadow-xs" 
                          : "text-muted-foreground hover:text-foreground hover:bg-card"
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: th.color }} />
                      <span>{th.label}</span>
                    </button>
                  ))}
                </div>

                {/* Gridlines Style */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground px-1 font-black">الحدود والشبكة:</span>
                  {[
                    { id: "full", label: "شبكة كاملة (Excel)" },
                    { id: "horizontal", label: "خطوط أفقية" },
                    { id: "outer", label: "إطار خارجي فقط" },
                    { id: "minimal", label: "بدون حدود" }
                  ].map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setTableGridStyle(g.id as any)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        tableGridStyle === g.id 
                          ? "bg-primary text-primary-foreground shadow-xs font-black" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* Zebra Toggle */}
                <label className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-xl border border-border/60 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enableZebra} 
                    onChange={e => setEnableZebra(e.target.checked)}
                    className="accent-primary w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <span className="text-xs font-black text-foreground">صفوف متناوبة (Zebra)</span>
                </label>

                {/* Freeze Header Toggle */}
                <label className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-xl border border-border/60 cursor-pointer" title="تثبيت رأس الجدول في الأعلى عند التمرير بالمعاينة">
                  <input 
                    type="checkbox" 
                    checked={freezeHeaderInPreview} 
                    onChange={e => setFreezeHeaderInPreview(e.target.checked)}
                    className="accent-primary w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <span className="text-xs font-black text-foreground">تجميد رأس الجدول (Freeze Header)</span>
                </label>

              </div>
            )}

            {/* TAB 3: TYPOGRAPHY & FONTS */}
            {activeRibbonTab === "typography" && (
              <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
                
                {/* Font Family */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground px-1 font-black">نوع الخط العربي:</span>
                  {[
                    { id: "cairo", label: "Cairo (القاهرة)" },
                    { id: "tajawal", label: "Tajawal (تجوال)" },
                    { id: "naskh", label: "نسخ / تقليدي" },
                    { id: "mono", label: "أحادي المسافة" }
                  ].map(fn => (
                    <button
                      key={fn.id}
                      type="button"
                      onClick={() => setFontFamily(fn.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        fontFamily === fn.id 
                          ? "bg-primary text-primary-foreground shadow-xs" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {fn.label}
                    </button>
                  ))}
                </div>

                {/* Font Size Stepper */}
                <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground px-1 font-black">حجم الخط:</span>
                  <button
                    type="button"
                    onClick={() => setDataFontSize(prev => Math.max(10, prev - 1) as any)}
                    className="w-6 h-6 rounded bg-card hover:bg-accent text-foreground flex items-center justify-center font-black cursor-pointer"
                    title="تصغير الخط A-"
                  >
                    -
                  </button>
                  <span className="px-2 font-mono font-black text-foreground">{dataFontSize}px</span>
                  <button
                    type="button"
                    onClick={() => setDataFontSize(prev => Math.min(16, prev + 1) as any)}
                    className="w-6 h-6 rounded bg-card hover:bg-accent text-foreground flex items-center justify-center font-black cursor-pointer"
                    title="تكبير الخط A+"
                  >
                    +
                  </button>
                </div>

                {/* Watermark Input */}
                <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-black">علامة مائية:</span>
                  <input 
                    type="text"
                    value={watermarkText}
                    onChange={e => setWatermarkText(e.target.value)}
                    placeholder="مثال: معتمد، سري، مسودة..."
                    className="w-32 h-6 px-2 text-xs rounded border border-border bg-background outline-none font-bold"
                  />
                  {watermarkText && (
                    <button
                      type="button"
                      onClick={() => setWatermarkText("")}
                      className="text-[10px] text-destructive hover:underline"
                    >
                      مسح
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* TAB 4: DATA & DENSITY */}
            {activeRibbonTab === "data" && (
              <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
                
                {/* Print Scope */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground px-1 font-black">نطاق الكشف:</span>
                  {[
                    { id: "all", label: `كامل السجلات (${filteredData.length})` },
                    { id: "page1", label: `أول صفحة (${a4RowsPerPage})` },
                    { id: "50", label: "أول 50" },
                    { id: "100", label: "أول 100" }
                  ].map(sc => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setPrintScope(sc.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        printScope === sc.id 
                          ? "bg-primary text-primary-foreground shadow-xs" 
                          : "text-muted-foreground hover:text-foreground hover:bg-card"
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>

                {/* Rows per page density (A4 Chunking) */}
                {currentTemplateObj?.type === "table" && (
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                    <span className="text-[10px] text-muted-foreground px-1 font-black">كثافة الورقة A4:</span>
                    {[15, 20, 25, 30, 40].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          setA4RowsPerPage(cnt);
                          setA4CurrentSheet(1);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          a4RowsPerPage === cnt 
                            ? "bg-primary text-primary-foreground shadow-xs" 
                            : "text-muted-foreground hover:text-foreground hover:bg-card"
                        }`}
                        title={`${cnt} سجل لكل ورقة A4`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Extra empty rows */}
                <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded-xl border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-black">أسطر فارغة إضافية:</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="20" 
                    value={extraEmptyRows} 
                    onChange={e => setExtraEmptyRows(parseInt(e.target.value) || 0)} 
                    className="w-12 h-6 border border-border rounded bg-background text-center text-xs font-bold outline-none"
                  />
                </div>

                {/* Summary calculation stats toggle */}
                <label className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-xl border border-border/60 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showSummaryStats} 
                    onChange={e => setShowSummaryStats(e.target.checked)}
                    className="accent-primary w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <span className="text-xs font-black text-foreground">شريط إحصائيات الأعمدة (المجموع/المتوسط)</span>
                </label>

              </div>
            )}

            {/* TAB 5: COLUMNS MANAGER */}
            {activeRibbonTab === "columns" && (
              <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text"
                    value={columnSearch}
                    onChange={e => setColumnSearch(e.target.value)}
                    placeholder="ابحث عن عمود..."
                    className="w-full h-8 pr-8 pl-3 text-xs rounded-xl border border-border/70 bg-background outline-none font-bold"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const allVisible: Record<string, boolean> = {};
                      currentTemplateObj.columns?.forEach(c => { allVisible[c.key] = false; });
                      setHiddenColumns(allVisible);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors cursor-pointer"
                  >
                    إظهار كل الأعمدة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const allHidden: Record<string, boolean> = {};
                      currentTemplateObj.columns?.forEach(c => { allHidden[c.key] = true; });
                      setHiddenColumns(allHidden);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:bg-accent text-xs font-bold transition-colors cursor-pointer"
                  >
                    إخفاء الكل
                  </button>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto max-w-xl py-0.5 no-scrollbar">
                  {filteredColumnsList.map(col => {
                    const isVisible = !hiddenColumns[col.key];
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => toggleColumn(col.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 shrink-0 cursor-pointer ${
                          isVisible 
                            ? "bg-primary/10 border-primary/30 text-primary" 
                            : "bg-muted/40 border-transparent text-muted-foreground line-through opacity-50"
                        }`}
                      >
                        {isVisible ? <Check className="w-3 h-3 text-primary" /> : <EyeOff className="w-3 h-3" />}
                        <span>{customHeaders[col.key] || col.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 6: SIGNATURES & APPROVALS */}
            {activeRibbonTab === "signatures" && (
              <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
                <label className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-xl border border-border/60 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showSignatures} 
                    onChange={e => setShowSignatures(e.target.checked)}
                    className="accent-primary w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <span className="text-xs font-black text-foreground">تفعيل التواقيع الرسمية</span>
                </label>

                {showSignatures && (
                  <>
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                      <span className="text-[10px] text-muted-foreground px-1 font-black">الموضع:</span>
                      <button
                        type="button"
                        onClick={() => setSignaturesPlacement("last_page")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          signaturesPlacement === "last_page" 
                            ? "bg-primary text-primary-foreground shadow-xs" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        في الورقة الأخيرة فقط (رسمي)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignaturesPlacement("all_pages")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          signaturesPlacement === "all_pages" 
                            ? "bg-primary text-primary-foreground shadow-xs" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        في كل ورقة
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={sig1Label}
                        onChange={e => setSig1Label(e.target.value)}
                        placeholder="الموقع الأول"
                        className="h-7 w-28 px-2 rounded-lg border border-border bg-background text-xs font-bold"
                        title="اسم المسمى الوظيفي للموقع الأول"
                      />
                      <input 
                        type="text"
                        value={sig2Label}
                        onChange={e => setSig2Label(e.target.value)}
                        placeholder="الموقع الثاني"
                        className="h-7 w-28 px-2 rounded-lg border border-border bg-background text-xs font-bold"
                        title="اسم المسمى الوظيفي للموقع الثاني"
                      />
                      <input 
                        type="text"
                        value={sig3Label}
                        onChange={e => setSig3Label(e.target.value)}
                        placeholder="الاعتماد النهائي"
                        className="h-7 w-32 px-2 rounded-lg border border-border bg-background text-xs font-bold"
                        title="اسم المسمى الوظيفي للاعتماد النهائي"
                      />
                    </div>
                  </>
                )}

                <label className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-xl border border-border/60 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showQrCode} 
                    onChange={e => setShowQrCode(e.target.checked)}
                    className="accent-primary w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <span className="text-xs font-black text-foreground">رمز التحقق الذكي (QR Code)</span>
                </label>
              </div>
            )}

            {/* TAB 7: EXPORT & TOOLS */}
            {activeRibbonTab === "export" && (
              <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير إكسيل كامل (CSV UTF-8)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport("html")}
                  className="px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LayoutTemplate className="w-4 h-4" />
                  <span>صفحة ويب تفاعلية مستقلة (HTML)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport("json")}
                  className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Code className="w-4 h-4" />
                  <span>بيانات رقمية خام (JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport("txt")}
                  className="px-3 py-1.5 rounded-xl border border-border/80 bg-muted/60 text-foreground hover:bg-muted flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>ملف نصي مجدول (TXT)</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =========================================================
          3. MAIN WORKSPACE (Split Paper Canvas & Control Drawer)
          ========================================================= */}
      <div className="flex-1 flex overflow-hidden relative print-engine-body">

        {/* CENTER / LEFT: CANVAS PREVIEW AREA */}
        <div 
          ref={canvasRef}
          className="flex-1 overflow-auto bg-slate-900/60 dark:bg-black/90 flex flex-col items-center p-3 sm:p-6 custom-scrollbar relative print-engine-scroll"
        >
          {/* Loading Indicator for huge datasets */}
          {isPreparingPrint && (
            <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md print:hidden">
              <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <h2 className="text-lg font-black text-foreground">جاري تجهيز الكشف والمستند للطباعة المعتمدة...</h2>
              <p className="text-muted-foreground text-xs mt-1 font-bold">يرجى الانتظار، جاري تحضير الصفحات</p>
            </div>
          )}

          {/* Edit Mode Notice Bar */}
          {editMode && (
            <div className="w-full max-w-3xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-2xl mb-3 text-xs font-black flex items-center justify-between shrink-0 animate-in fade-in print:hidden">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>وضع التحرير المباشر (WYSIWYG) مفعل: اضغط على أي نص أو عنوان أو خلية لتعديلها فوراً قبل الطباعة.</span>
              </div>
              <button 
                type="button" 
                onClick={() => setEditMode(false)}
                className="text-xs underline hover:no-underline font-black cursor-pointer mr-2"
              >
                إنهاء
              </button>
            </div>
          )}

          {/* Horizontal Paper Ruler (Word-style) */}
          <HorizontalRuler 
            widthMm={paperWidthMm} 
            zoom={zoom} 
            marginLeftMm={marginMm} 
            marginRightMm={marginMm} 
          />

          {/* SCALED PAPER CONTAINER */}
          <div 
            style={{ 
              transform: editMode ? 'none' : `scale(${zoom})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="transition-all print-engine-scale pb-16"
          >
            {/* VIEW MODE: EXCEL CONTINUOUS SHEET VIEW */}
            {viewMode === "sheet" && currentTemplateObj?.type === "table" ? (
              <div 
                className="bg-white text-slate-900 rounded-xl shadow-2xl p-6 relative max-w-full overflow-hidden"
                style={{
                  width: paperOrientation === 'landscape' ? '1200px' : '900px',
                  fontFamily: fontFamilyCss,
                  color: textColor
                }}
              >
                {/* Excel Sheet Bar Header */}
                <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900">{customTitle}</h2>
                      <p className="text-xs text-slate-500 font-bold">{customSubtitle || "معاينة ورقة العمل المستمرة بنمط جداول إكسيل"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                      {filteredData.length} سجل متصل
                    </span>
                  </div>
                </div>

                {/* Table Container with Sticky Freeze Header */}
                <div className="overflow-x-auto max-h-[700px] border border-slate-300 rounded-lg relative custom-scrollbar">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead className={freezeHeaderInPreview ? "sticky top-0 z-30 shadow-xs" : ""}>
                      <tr>
                        {showPageNumbers && (
                          <th 
                            className="p-2.5 border border-slate-300 font-black w-14 text-center text-xs"
                            style={{ backgroundColor: headerBackgroundColor, color: headerTextColor }}
                          >
                            #
                          </th>
                        )}
                        {currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).map(col => {
                          const isPhoneOrCode = isCodeOrPhone(col.key, col.label);
                          const alignment = columnAlignments[col.key] || (isPhoneOrCode ? "center" : "right");
                          return (
                            <th 
                              key={col.key} 
                              className={`p-2.5 border border-slate-300 font-black text-xs transition-colors ${
                                alignment === "center" ? "text-center" : alignment === "left" ? "text-left" : "text-right"
                              }`}
                              style={{ backgroundColor: headerBackgroundColor, color: headerTextColor }}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-extrabold">{customHeaders[col.key] || col.label}</span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: `${dataFontSize}px` }}>
                      {previewData.map((row: any, rIdx: number) => (
                        <tr 
                          key={rIdx} 
                          className="hover:bg-blue-50/60 transition-colors"
                          style={{ 
                            backgroundColor: enableZebra && rIdx % 2 !== 0 ? stripeColor : 'transparent' 
                          }}
                        >
                          {showPageNumbers && (
                            <td className="p-2 border border-slate-200 text-center font-bold text-xs tabular-nums text-slate-500">
                              {rIdx + 1}
                            </td>
                          )}
                          {currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).map(col => {
                            const rawValue = col.render ? col.render(row) : row[col.key] ?? "-";
                            const isCodePhone = isCodeOrPhone(col.key, col.label);
                            const alignment = columnAlignments[col.key] || (isCodePhone ? "center" : "right");

                            return (
                              <td 
                                key={col.key} 
                                className={`p-2 border border-slate-200 font-bold ${
                                  alignment === "center" ? "text-center font-mono tabular-nums" : alignment === "left" ? "text-left" : "text-right"
                                }`}
                                dir={isCodePhone ? "ltr" : "rtl"}
                              >
                                {React.isValidElement(rawValue) ? rawValue : (rawValue !== undefined && rawValue !== null ? String(rawValue) : "-")}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>

                    {/* Summary Row (Excel Stats) */}
                    {showSummaryStats && (
                      <tfoot className="sticky bottom-0 z-20 bg-slate-100 border-t-2 border-slate-300 font-black">
                        <tr>
                          {showPageNumbers && (
                            <td className="p-2.5 border border-slate-300 text-center text-xs font-black text-slate-700">
                              الإجمالي
                            </td>
                          )}
                          {currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).map(col => {
                            const stat = summaryCalculations[col.key];
                            return (
                              <td key={col.key} className="p-2.5 border border-slate-300 text-center text-xs">
                                {stat ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-slate-500 font-bold">مجموع: {stat.sum}</span>
                                    <span className="text-primary font-black">متوسط: {stat.avg}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            ) : (
              /* VIEW MODES: A4 MULTI-PAGE OR SINGLE SHEET */
              <div id="print-paper-stack" className="print-paper-canvas-stack space-y-8 print:space-y-0">
                {currentTemplateObj?.type === "table" ? (
                  // TABLE TEMPLATES: A4 MULTI-PAGE CHUNKING ENGINE
                  (showAllForPrint 
                    ? tableChunks 
                    : (viewMode === "single" ? [tableChunks[safeCurrentSheet - 1] || []] : tableChunks)
                  ).map((chunk, cIdx) => {
                    const actualSheetIndex = (!showAllForPrint && viewMode === "single") ? safeCurrentSheet - 1 : cIdx;
                    const isLastChunk = actualSheetIndex === totalSheets - 1;
                    const startRowIndex = actualSheetIndex * a4RowsPerPage;

                    return (
                      <div key={actualSheetIndex} className="relative group">
                        
                        {/* Visual Sheet Banner in Multi-page preview */}
                        {!showAllForPrint && !isPreparingPrint && totalSheets > 1 && viewMode === "pages" && (
                          <div className="w-full flex items-center justify-between px-5 py-2 bg-slate-800 text-white rounded-t-xl text-xs font-black shadow-sm print:hidden">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-primary" />
                              <span>ورقة معتمدة رقم {actualSheetIndex + 1} من {totalSheets}</span>
                            </div>
                            <div className="text-[11px] text-slate-300 font-bold">
                              السجلات ({startRowIndex + 1} إلى {startRowIndex + chunk.length}) من أصل {filteredData.length}
                            </div>
                          </div>
                        )}

                        {/* PHYSICAL A4 SHEET CANVAS */}
                        <div 
                          className={`bg-white text-slate-900 shadow-2xl print:shadow-none transition-all relative print-paper-canvas ${
                            !showAllForPrint && !isPreparingPrint && totalSheets > 1 && viewMode === "pages" ? 'rounded-b-sm' : 'rounded-sm'
                          } ${
                            paperOrientation === 'landscape' 
                              ? (paperSize === 'A3' ? 'w-[420mm] min-h-[297mm]' : 'w-[297mm] min-h-[210mm]') 
                              : (paperSize === 'A3' ? 'w-[297mm] min-h-[420mm]' : 'w-[210mm] min-h-[297mm]')
                          } ${marginPaddingCss} ${pageFrame ? 'ring-4 ring-offset-4 ring-offset-white' : ''}`}
                          style={{
                            fontFamily: fontFamilyCss,
                            color: textColor,
                            ...(pageFrame && { outlineStyle: pageFrameStyle, outlineColor: tableBorderColor, outlineWidth: '4px' })
                          }}
                        >
                          {/* Watermark Overlay */}
                          {watermarkText && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
                              <span className="text-8xl font-black text-slate-900/[0.04] rotate-[-30deg] tracking-widest uppercase">
                                {watermarkText}
                              </span>
                            </div>
                          )}

                          {/* OFFICIAL ROYAL DOCUMENT HEADER */}
                          {showHeader && (
                            <div 
                              className="mb-5 flex items-center justify-between border-b-2 pb-3.5 print-header-grid relative z-10" 
                              style={{ borderColor: tableBorderColor }}
                            >
                              {/* Right Header: Kingdom / Ministry / School */}
                              <div className="flex items-center gap-3 text-right print-header-col-right shrink-0">
                                <div 
                                  className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center overflow-hidden bg-slate-50 text-muted-foreground shadow-xs shrink-0" 
                                  style={{ borderColor: tableBorderColor }}
                                >
                                  <ImageIcon className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="space-y-0.5">
                                  <EditableText tagName="h1" value="المملكة العربية السعودية" className="text-xs font-bold whitespace-nowrap" />
                                  <EditableText tagName="h2" value="وزارة التعليم" className="text-xs font-bold text-slate-700 whitespace-nowrap" />
                                  <EditableText tagName="h3" value={educationDept} onChange={setEducationDept} className="text-[11px] font-semibold text-slate-600 whitespace-nowrap" />
                                  <EditableText tagName="h4" value={schoolName} onChange={setSchoolName} className="text-xs font-black text-primary whitespace-nowrap" />
                                </div>
                              </div>

                              {/* Center Header: Document Title & Subtitle */}
                              <div className="text-center px-4 flex-1 print-header-col-center">
                                <EditableText 
                                  tagName="h2" 
                                  value={customTitle} 
                                  onChange={setCustomTitle} 
                                  className="text-xl sm:text-2xl font-black mb-1 hover:bg-slate-100/80 rounded-xl p-1 inline-block" 
                                  style={{ color: titleColor }} 
                                />
                                <EditableText 
                                  tagName="p" 
                                  value={customSubtitle || "كشف وتقرير رسمي معتمد ومحدث من قاعدة البيانات"} 
                                  onChange={setCustomSubtitle} 
                                  className="text-xs font-bold text-slate-600 hover:bg-slate-100/80 rounded-lg p-0.5 block" 
                                />
                                {totalSheets > 1 && (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black border border-slate-300 mt-1">
                                    <span>ورقة {actualSheetIndex + 1} من {totalSheets}</span>
                                    <span className="opacity-40">•</span>
                                    <span>سجلات {startRowIndex + 1} - {startRowIndex + chunk.length}</span>
                                  </div>
                                )}
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
                                  <span className="font-bold text-slate-700">إجمالي السجلات:</span>
                                  <span className="font-bold tabular-nums text-primary">{filteredData.length}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* THE FORMAL REPORT TABLE */}
                          <div className="w-full relative z-10">
                            <table 
                              className="w-full text-right border-collapse" 
                              style={{ ...tableBorderStyleObj }}
                            >
                              <thead 
                                style={{ display: 'table-header-group' }}
                                className={freezeHeaderInPreview ? "sticky top-0 z-20 shadow-xs" : ""}
                              >
                                <tr>
                                  {showPageNumbers && (
                                    <th 
                                      className="p-2 border font-black w-12 text-center text-xs" 
                                      style={{ backgroundColor: headerBackgroundColor, color: headerTextColor, ...tableBorderStyleObj }}
                                    >
                                      #
                                    </th>
                                  )}
                                  {currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).map(col => {
                                    const isPhoneOrCode = isCodeOrPhone(col.key, col.label);
                                    const alignment = columnAlignments[col.key] || (isPhoneOrCode ? "center" : "right");
                                    return (
                                      <th 
                                        key={col.key} 
                                        className={`p-2 border font-black text-xs transition-colors ${
                                          alignment === "center" ? "text-center whitespace-nowrap" : alignment === "left" ? "text-left" : "text-right whitespace-nowrap"
                                        }`} 
                                        style={{ backgroundColor: headerBackgroundColor, color: headerTextColor, ...tableBorderStyleObj }}
                                      >
                                        <EditableText 
                                          tagName="div" 
                                          value={customHeaders[col.key] || col.label} 
                                          onChange={(val: string) => setCustomHeaders(prev => ({ ...prev, [col.key]: val }))}
                                          className={`w-full font-black ${alignment === "center" ? "text-center" : alignment === "left" ? "text-left" : "text-right"}`}
                                        />
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody style={{ fontSize: `${dataFontSize}px` }}>
                                {chunk.map((row: any, rIdx: number) => {
                                  const continuousNumber = startRowIndex + rIdx + 1;
                                  return (
                                    <tr 
                                      key={rIdx} 
                                      style={{ 
                                        backgroundColor: enableZebra && rIdx % 2 !== 0 ? stripeColor : 'transparent', 
                                        pageBreakInside: 'avoid' 
                                      }}
                                    >
                                      {showPageNumbers && (
                                        <td 
                                          className="p-2 border text-center font-bold text-xs tabular-nums text-slate-600" 
                                          style={{ ...tableBorderStyleObj }}
                                        >
                                          {continuousNumber}
                                        </td>
                                      )}
                                      {currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).map(col => {
                                        const rawValue = col.render ? col.render(row) : row[col.key] ?? "-";
                                        const isCodePhone = isCodeOrPhone(col.key, col.label);
                                        const alignment = columnAlignments[col.key] || (isCodePhone ? "center" : "right");

                                        return (
                                          <td 
                                            key={col.key} 
                                            className={`p-2 border ${
                                              alignment === "center" ? "text-center whitespace-nowrap" : alignment === "left" ? "text-left" : "text-right"
                                            }`} 
                                            style={{ ...tableBorderStyleObj }}
                                          >
                                            {editMode && !showAllForPrint ? (
                                              <EditableText 
                                                tagName="div" 
                                                value={rawValue} 
                                                isNumeric={isCodePhone}
                                                className={`w-full font-bold ${alignment === "center" ? "text-center font-mono tabular-nums" : "text-right"}`} 
                                              />
                                            ) : (
                                              <div 
                                                className={`w-full font-bold ${
                                                  alignment === "center" ? "text-center font-mono tabular-nums" : "text-right"
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
                                  );
                                })}

                                {/* Extra empty rows on final sheet if requested */}
                                {isLastChunk && Array.from({ length: extraEmptyRows }).map((_, idx) => (
                                  <tr key={`empty-${idx}`}>
                                    {showPageNumbers && (
                                      <td className="p-2 border text-center text-xs text-slate-400" style={tableBorderStyleObj}>
                                        {startRowIndex + chunk.length + idx + 1}
                                      </td>
                                    )}
                                    {currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).map(col => (
                                      <td key={col.key} className="p-2 border h-8" style={tableBorderStyleObj}>
                                        &nbsp;
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Official Signatures */}
                          {showSignatures && (signaturesPlacement === "all_pages" || isLastChunk) && (
                            <div className="mt-8 flex justify-between px-6 pb-4 relative z-10 break-inside-avoid">
                              <div className="text-center">
                                <EditableText tagName="p" className="font-bold text-xs mb-6 text-slate-700" value={sig1Label} onChange={setSig1Label} />
                                <div className="w-36 border-b-2" style={{ borderColor: tableBorderColor }} />
                              </div>
                              <div className="text-center">
                                <EditableText tagName="p" className="font-bold text-xs mb-6 text-slate-700" value={sig2Label} onChange={setSig2Label} />
                                <div className="w-36 border-b-2" style={{ borderColor: tableBorderColor }} />
                              </div>
                              <div className="text-center">
                                <EditableText tagName="p" className="font-bold text-xs mb-6 text-slate-700" value={sig3Label} onChange={setSig3Label} />
                                <div className="w-36 border-b-2" style={{ borderColor: tableBorderColor }} />
                              </div>
                            </div>
                          )}

                          {/* QR Verification & Official Serial Footer on last sheet */}
                          {showQrCode && isLastChunk && (
                            <div className="mt-4 flex items-center justify-center gap-3 pb-3 relative z-10 print:fixed print:bottom-6 print:left-1/2 print:-translate-x-1/2">
                              <QRCode value={qrCodeData} size={60} level="L" />
                              <div className="text-[10px] text-slate-500 font-bold text-right">
                                <div>وثيقة رقمية معتمدة</div>
                                <div className="font-mono">{new Date().toLocaleDateString('ar-SA')}</div>
                              </div>
                            </div>
                          )}

                          {/* Page Footer */}
                          <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-bold relative z-10">
                            <span>{schoolName} • نظام دارسي Pro</span>
                            <span>صفحة {actualSheetIndex + 1} من {totalSheets}</span>
                          </div>

                        </div>
                      </div>
                    );
                  })
                ) : (
                  // NON-TABLE TEMPLATES: CERTIFICATES, CARDS, RECEIPTS, CUSTOM DOCUMENTS
                  <div 
                    className={`bg-white text-slate-900 shadow-2xl print:shadow-none transition-all relative print-paper-canvas rounded-sm ${
                      paperOrientation === 'landscape' ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'
                    } ${marginPaddingCss} ${pageFrame ? 'ring-4 ring-offset-4 ring-offset-white' : ''}`}
                    style={{
                      fontFamily: fontFamilyCss,
                      color: textColor,
                      ...(pageFrame && { outlineStyle: pageFrameStyle, outlineColor: tableBorderColor, outlineWidth: '4px' })
                    }}
                  >
                    {/* Official Royal Header */}
                    {showHeader && (
                      <div 
                        className="mb-6 flex items-center justify-between border-b-2 pb-4 print-header-grid" 
                        style={{ borderColor: tableBorderColor }}
                      >
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
                            <EditableText tagName="h3" value={educationDept} onChange={setEducationDept} className="text-[11px] font-semibold text-slate-600 whitespace-nowrap" />
                            <EditableText tagName="h4" value={schoolName} onChange={setSchoolName} className="text-xs font-black text-primary whitespace-nowrap" />
                          </div>
                        </div>

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

                    {/* CUSTOM DOCUMENT CONTENT */}
                    {currentTemplateObj?.type === "document" && currentTemplateObj.renderDocument && (
                      <div className="w-full flex flex-col">
                        {previewData.map((row, idx) => (
                          <div key={idx} className="w-full print:break-after-page border-b-4 print:border-b-0 border-dashed border-primary/20 pb-12 mb-12 print:mb-0 print:pb-0 last:border-b-0 last:mb-0 last:pb-0 relative">
                            {currentTemplateObj.renderDocument?.({ ...{ hiddenColumns, fontSize: "sm", stripeRows: true, extraEmptyRows, showHeader, showSignatures, customNote, customOptions, themePreset } }, [row])}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CERTIFICATES */}
                    {currentTemplateObj?.type === "certificate" && (
                      <div className="space-y-12">
                        {previewData.map((row, idx) => (
                          <div key={idx} className="text-center space-y-8 p-12 border-8 border-double rounded-3xl" style={{ borderColor: tableBorderColor }}>
                            <h1 className="text-4xl font-black text-primary">شهادة شكر وتقدير وتفوق</h1>
                            <p className="text-base font-bold text-slate-600">تتشرف إدارة {schoolName} بمنح هذه الشهادة للطالب/ة:</p>
                            <h2 className="text-3xl font-black text-slate-900 border-b-4 inline-block px-8 pb-2" style={{ borderColor: tableBorderColor }}>
                              {row.name || row[currentTemplateObj.columns?.[0]?.key || "id"]}
                            </h2>
                            <p className="text-sm font-medium text-slate-700 max-w-xl mx-auto leading-relaxed">
                              تقديراً لجهوده المتميزة وتفوقه الأكاديمي وانضباطه السلوكي المشرف خلال العام الدراسي.
                            </p>
                            <div className="grid grid-cols-2 gap-20 mt-12 w-full px-12 pt-8">
                              <div>
                                <p className="font-bold text-xs mb-6">{sig1Label}</p>
                                <div className="w-40 border-b-2 mx-auto" style={{ borderColor: tableBorderColor }} />
                              </div>
                              <div>
                                <p className="font-bold text-xs mb-6">{sig3Label}</p>
                                <div className="w-40 border-b-2 mx-auto" style={{ borderColor: tableBorderColor }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            4. RIGHT: COLLAPSIBLE LUXURY CONTROL DRAWER
            ========================================================= */}
        {sidebarOpen && (
          <aside className="w-[360px] bg-card border-s border-border/80 flex flex-col print:hidden shadow-2xl z-30 shrink-0 animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-border/80 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <h3 className="font-black text-xs text-foreground">خيارات وتخصيص الكشف</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {filteredData.length} سجل
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-2 py-0.5 rounded-lg border border-border/70 hover:bg-muted text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                  title="العودة وإغلاق محرك الطباعة"
                >
                  <ArrowRight className="w-3 h-3 text-primary" />
                  <span>عودة</span>
                </button>
              </div>
            </div>

            {/* Scrollable Settings Accordions with pb-4 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
              
              {/* SECTION 1: TEMPLATES */}
              <Accordion title="قوالب الطباعة المتاحة" icon={LayoutTemplate} badge={templates.length} defaultOpen={true}>
                <div className="space-y-1.5">
                  {categories.map(cat => (
                    <div key={cat} className="space-y-1">
                      <div className="text-[10px] font-black text-muted-foreground uppercase">{cat}</div>
                      <div className="grid grid-cols-1 gap-1">
                        {templates.filter(t => t.category === cat).map(t => {
                          const isSelected = selectedTemplate === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setSelectedTemplate(t.id)}
                              className={`w-full text-right p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                                isSelected 
                                  ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                                  : "bg-background border-border/70 hover:bg-accent text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`p-1 rounded-lg shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-muted text-primary"}`}>
                                  {t.type === 'cards' ? <LayoutGrid className="w-3.5 h-3.5" /> :
                                   t.type === 'certificate' ? <Award className="w-3.5 h-3.5" /> :
                                   t.type === 'receipt' ? <FileText className="w-3.5 h-3.5" /> :
                                   <LayoutTemplate className="w-3.5 h-3.5" />}
                                </div>
                                <div className="truncate">
                                  <div className="font-black truncate">{t.name}</div>
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

              {/* SECTION 2: COLUMNS VISIBILITY */}
              {currentTemplateObj?.type === "table" && (
                <Accordion 
                  title="أعمدة الكشف (إظهار / إخفاء)" 
                  icon={Columns} 
                  badge={`${currentTemplateObj.columns?.filter(c => !hiddenColumns[c.key]).length} عمود`}
                  defaultOpen={false}
                >
                  <div className="space-y-2">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const allVisible: Record<string, boolean> = {};
                          currentTemplateObj.columns?.forEach(c => { allVisible[c.key] = false; });
                          setHiddenColumns(allVisible);
                        }}
                        className="flex-1 py-1 rounded-lg text-[10px] font-black bg-muted hover:bg-accent text-foreground transition-colors cursor-pointer"
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
                        className="flex-1 py-1 rounded-lg text-[10px] font-black bg-muted hover:bg-accent text-foreground transition-colors cursor-pointer"
                      >
                        إخفاء الكل
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
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
                            <span className="truncate">{col.label}</span>
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => toggleColumn(col.key)}
                              className="accent-primary w-4 h-4 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </Accordion>
              )}

              {/* SECTION 3: EDIT SCHOOL & MINISTRY HEADERS */}
              <Accordion title="الترويسة وبيانات المدرسة" icon={Building2} defaultOpen={false}>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-black text-muted-foreground mb-1">اسم المدرسة الرسمي:</label>
                    <input 
                      type="text"
                      value={schoolName}
                      onChange={e => setSchoolName(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xl border border-input bg-background text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted-foreground mb-1">إدارة التعليم:</label>
                    <input 
                      type="text"
                      value={educationDept}
                      onChange={e => setEducationDept(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xl border border-input bg-background text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted-foreground mb-1">عنوان الكشف الرئيسي:</label>
                    <input 
                      type="text"
                      value={customTitle}
                      onChange={e => setCustomTitle(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xl border border-input bg-background text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              </Accordion>

              {/* SECTION 4: DATA FILTERING */}
              {(availableGrades.length > 0 || availableSections.length > 0) && (
                <Accordion title="تصفية الصفوف والشعب" icon={Filter} defaultOpen={false}>
                  <div className="space-y-2 text-xs">
                    {availableGrades.length > 0 && (
                      <div>
                        <div className="font-black text-[10px] text-muted-foreground mb-1">الصف الدراسي:</div>
                        <div className="grid grid-cols-2 gap-1">
                          {availableGrades.map(g => (
                            <label key={g} className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-muted/40 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={selectedGrades.has(g)} 
                                onChange={() => {
                                  const next = new Set(selectedGrades);
                                  if (next.has(g)) next.delete(g); else next.add(g);
                                  setSelectedGrades(next);
                                }} 
                                className="accent-primary w-3.5 h-3.5 rounded cursor-pointer" 
                              />
                              <span className="font-bold truncate text-xs">{g}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableSections.length > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <div className="font-black text-[10px] text-muted-foreground mb-1">الشعبة:</div>
                        <div className="grid grid-cols-2 gap-1">
                          {availableSections.map(s => {
                            const secName = globalStore.activeStageSections.find(x => x.id === s)?.name || s;
                            return (
                              <label key={s} className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-muted/40 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={selectedSections.has(s)} 
                                  onChange={() => {
                                    const next = new Set(selectedSections);
                                    if (next.has(s)) next.delete(s); else next.add(s);
                                    setSelectedSections(next);
                                  }} 
                                  className="accent-primary w-3.5 h-3.5 rounded cursor-pointer" 
                                />
                                <span className="font-bold truncate text-xs">شعبة {secName}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Accordion>
              )}

              {/* SECTION 5: SIGNATURES CUSTOMIZATION */}
              <Accordion title="مسميات الاعتمادات الرسمية" icon={BadgeCheck} defaultOpen={false}>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-black text-muted-foreground mb-1">الموقع الأول:</label>
                    <input 
                      type="text"
                      value={sig1Label}
                      onChange={e => setSig1Label(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xl border border-input bg-background text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted-foreground mb-1">الموقع الثاني:</label>
                    <input 
                      type="text"
                      value={sig2Label}
                      onChange={e => setSig2Label(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xl border border-input bg-background text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted-foreground mb-1">الموقع الثالث (الاعتماد النهائي):</label>
                    <input 
                      type="text"
                      value={sig3Label}
                      onChange={e => setSig3Label(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xl border border-input bg-background text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              </Accordion>

            </div>

            {/* STICKY DRAWER BOTTOM CTA (Separated container - NEVER OVERLAPS!) */}
            <div className="p-3.5 border-t border-border/80 bg-card/95 sticky bottom-0 z-20 shadow-lg space-y-2">
              <button 
                type="button"
                onClick={handlePrint} 
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-xs font-black shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة المستند الآن (Ctrl + P)</span>
              </button>

              <button 
                type="button"
                onClick={onClose} 
                className="w-full flex items-center justify-center gap-1.5 border border-border/80 bg-muted/40 hover:bg-muted text-foreground py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span>العودة وإغلاق المعاينة</span>
              </button>
            </div>

          </aside>
        )}

      </div>

      {/* =========================================================
          5. WORD & EXCEL STYLE BOTTOM STATUS BAR
          ========================================================= */}
      <footer className="h-9 border-t border-border/80 bg-card/95 backdrop-blur-md px-4 flex items-center justify-between text-xs font-bold text-muted-foreground shrink-0 z-30 print:hidden select-none">
        
        {/* Right (RTL Start): Page & Record Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-foreground">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>
              {totalSheets > 1 
                ? `ورقة ${safeCurrentSheet} من ${totalSheets}` 
                : "ورقة واحدة معتمدة"}
            </span>
          </div>
          <span className="opacity-30">•</span>
          <span>{filteredData.length} سجل</span>
          <span className="opacity-30 hidden sm:inline">•</span>
          <span className="hidden sm:inline">نظام مقاييس A4 ({paperOrientation === "landscape" ? "297 × 210 مم" : "210 × 297 مم"})</span>
        </div>

        {/* Center: Single Sheet Navigation Stepper */}
        {viewMode === "single" && totalSheets > 1 && (
          <div className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-lg border border-border/60">
            <button
              type="button"
              disabled={safeCurrentSheet <= 1}
              onClick={() => setA4CurrentSheet(p => Math.max(1, p - 1))}
              className="p-1 hover:bg-card rounded disabled:opacity-30 cursor-pointer"
              title="الورقة السابقة"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black text-foreground tabular-nums px-2">
              ورقة {safeCurrentSheet} / {totalSheets}
            </span>
            <button
              type="button"
              disabled={safeCurrentSheet >= totalSheets}
              onClick={() => setA4CurrentSheet(p => Math.min(totalSheets, p + 1))}
              className="p-1 hover:bg-card rounded disabled:opacity-30 cursor-pointer"
              title="الورقة التالية"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Left (RTL End): Interactive Live Zoom Stepper */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFitToScreen}
            className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors hidden md:inline cursor-pointer"
            title="ملاءمة الصفحة مع الشاشة"
          >
            احتواء
          </button>
          <button
            type="button"
            onClick={() => setZoom(1.0)}
            className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors hidden md:inline cursor-pointer"
            title="الحجم الحقيقي 100%"
          >
            100%
          </button>

          <div className="flex items-center gap-1 bg-muted/50 px-1 py-0.5 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(0.4, Math.round((z - 0.1) * 100) / 100))}
              className="p-0.5 hover:bg-card rounded text-muted-foreground hover:text-foreground cursor-pointer"
              title="تصغير (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Slider */}
            <input 
              type="range"
              min="0.4"
              max="1.5"
              step="0.05"
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="w-16 h-1 accent-primary cursor-pointer hidden sm:block"
            />

            <span className="text-[11px] font-black text-foreground min-w-[34px] text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={() => setZoom(z => Math.min(1.5, Math.round((z + 0.1) * 100) / 100))}
              className="p-0.5 hover:bg-card rounded text-muted-foreground hover:text-foreground cursor-pointer"
              title="تكبير (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </footer>

    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
