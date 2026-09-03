import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal } from '../common/Modal.js';
import { ConfirmDialog } from '../common/ConfirmDialog.js';
import { WhiteboardStroke, WhiteboardPoint } from '../../types/index.js';
import {
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Minus,
  Trash2,
  Download,
  Share2,
  Hand,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Palette,
  Sun,
  Moon,
  Grid,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Ruler,
  ChevronDown,
  ArrowRight,
  Triangle,
  Sparkles,
  Layers,
  Sliders,
  Edit3,
  Feather,
  Paintbrush,
  Activity,
  MousePointer2,
  Scissors,
  Type,
  StickyNote,
  Plus,
  X,
  Check
} from 'lucide-react';

interface RemoteCursor {
  x: number;
  y: number;
  userName: string;
  isFaculty: boolean;
  isDrawing: boolean;
  lastUpdated: number;
}

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  strokes: WhiteboardStroke[];
  onEmitStroke: (stroke: WhiteboardStroke) => void;
  onClearWhiteboard: () => void;
  onBroadcastImage: (file: File) => Promise<any>;
  onEmitCursor?: (x: number, y: number, isDrawing?: boolean) => void;
  remoteCursors?: Map<string, RemoteCursor>;
}

type PenSubType = 'pen' | 'fountain' | 'pencil' | 'brush' | 'ballpoint' | 'marker';
type EraserSubType = 'eraser' | 'object_eraser' | 'highlighter_eraser' | 'area_eraser';

type ToolType =
  | PenSubType
  | 'highlighter'
  | EraserSubType
  | 'select'
  | 'text'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'arrow'
  | 'line'
  | 'star'
  | 'pan';

type CanvasTheme = 'light' | 'dark';
type CanvasPattern = 'plain' | 'grid' | 'dots' | 'lines';
type PressureMode = 'stylus' | 'speed' | 'fixed';

interface PenBoxSlot {
  id: string;
  type: PenSubType | 'highlighter';
  color: string;
  size: number;
  opacity: number;
  label: string;
}

const DEFAULT_PEN_BOX: PenBoxSlot[] = [
  { id: 'p1', type: 'fountain', color: '#FF2D55', size: 3, opacity: 100, label: '0.6' },
  { id: 'p2', type: 'highlighter', color: '#32ADE6', size: 24, opacity: 50, label: '1.25' },
  { id: 'p3', type: 'pen', color: '#007AFF', size: 4, opacity: 100, label: '0.5' },
  { id: 'p4', type: 'pencil', color: '#34C759', size: 3, opacity: 85, label: '2.0' },
  { id: 'p5', type: 'brush', color: '#FF9500', size: 10, opacity: 95, label: '1.75' },
  { id: 'p6', type: 'ballpoint', color: '#1C1C1E', size: 2, opacity: 100, label: '0.6' }
];

const APPLE_PALETTE = [
  { name: 'Obsidian', hex: '#1C1C1E' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Slate', hex: '#8E8E93' },
  { name: 'Classic Blue', hex: '#007AFF' },
  { name: 'Cyan', hex: '#32ADE6' },
  { name: 'Teal', hex: '#30B0C7' },
  { name: 'Emerald', hex: '#34C759' },
  { name: 'Sunset Amber', hex: '#FF9500' },
  { name: 'Crimson', hex: '#FF3B30' },
  { name: 'Indigo', hex: '#5856D6' },
  { name: 'Vibrant Fuchsia', hex: '#FF2D55' }
];

const PEN_PRESETS = [2, 4, 8, 16, 28];
const HIGHLIGHTER_PRESETS = [12, 20, 32, 48, 64];
const ERASER_PRESETS = [12, 24, 48, 80];

const PEN_TOOLS: Array<{ id: PenSubType; label: string; icon: any; desc: string }> = [
  { id: 'fountain', label: 'Fude / Fountain Pen', icon: Feather, desc: 'Calligraphic stroke with expressive taper' },
  { id: 'pen', label: 'Ink Pen', icon: Pen, desc: 'Natural ink with smooth pressure curve' },
  { id: 'pencil', label: 'Sketch Pencil (2B)', icon: Pen, desc: 'Textured graphite with tilt/pressure shading' },
  { id: 'ballpoint', label: 'Ballpoint Pen', icon: Edit3, desc: 'Uniform crisp line for precision & notes' },
  { id: 'brush', label: 'Art Brush', icon: Paintbrush, desc: 'Dynamic wide brush with pressure modulation' },
  { id: 'marker', label: 'Luminous Marker', icon: Sparkles, desc: 'Soft glowing marker for diagrams' }
];

const ERASER_TOOLS: Array<{ id: EraserSubType; label: string; icon: any; desc: string }> = [
  { id: 'eraser', label: 'Standard Brush Eraser', icon: Eraser, desc: 'Erases pixels smoothly along stroke path' },
  { id: 'object_eraser', label: 'Object / Shape Eraser', icon: Scissors, desc: '1-click delete of entire stroke or shape' },
  { id: 'highlighter_eraser', label: 'Highlighter-Only Eraser', icon: Highlighter, desc: 'Erases highlighter while keeping pens & shapes' },
  { id: 'area_eraser', label: 'Lasso Area Eraser', icon: Square, desc: 'Drag a box to erase all contents inside' }
];

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({
  isOpen,
  onClose,
  strokes,
  onEmitStroke,
  onClearWhiteboard,
  onBroadcastImage,
  onEmitCursor,
  remoteCursors
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Tools & Styling
  const [tool, setTool] = useState<ToolType>('pen');
  const [activePenType, setActivePenType] = useState<PenSubType>('pen');
  const [activeEraserType, setActiveEraserType] = useState<EraserSubType>('eraser');
  const [color, setColor] = useState('#007AFF');
  const [size, setSize] = useState(4);
  const [highlighterSize, setHighlighterSize] = useState(24);
  const [eraserSize, setEraserSize] = useState(24);
  const [opacity, setOpacity] = useState(100);
  const [pressureSensitivity, setPressureSensitivity] = useState(60); // 0-100%
  const [pressureMode, setPressureMode] = useState<PressureMode>('stylus');
  const [customColor, setCustomColor] = useState('#007AFF');
  const [canvasTheme, setCanvasTheme] = useState<CanvasTheme>('light');
  const [canvasPattern, setCanvasPattern] = useState<CanvasPattern>('plain');
  const [showRuler, setShowRuler] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Floating Pen Box (Customizable dock)
  const [penBoxSlots, setPenBoxSlots] = useState<PenBoxSlot[]>(DEFAULT_PEN_BOX);
  const [activePenBoxId, setActivePenBoxId] = useState<string | null>('p3');
  const [isPenBoxExpanded, setIsPenBoxExpanded] = useState(true);

  // Text Tool Modal / Input State
  const [textInputPos, setTextInputPos] = useState<WhiteboardPoint | null>(null);
  const [textInputString, setTextInputString] = useState('');
  const [textFontSize, setTextFontSize] = useState(24);
  const [isTextBold, setIsTextBold] = useState(true);

  // Menu Dropdowns
  const [isPenMenuOpen, setIsPenMenuOpen] = useState(false);
  const [isEraserMenuOpen, setIsEraserMenuOpen] = useState(false);
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);
  const [isCanvasSettingsOpen, setIsCanvasSettingsOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [showToolCustomizer, setShowToolCustomizer] = useState(false);

  // Shape Move & Selection state
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
  const [isDraggingSelected, setIsDraggingSelected] = useState(false);
  const dragStartRef = useRef<WhiteboardPoint>({ x: 0, y: 0 });
  const initialStrokeSnapshotRef = useRef<WhiteboardStroke | null>(null);

  // Pan & Zoom Navigation
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Undo / Redo history stack
  const [localStrokes, setLocalStrokes] = useState<WhiteboardStroke[]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardStroke[]>([]);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPointsRef = useRef<WhiteboardPoint[]>([]);
  const lastPointTimeRef = useRef<number>(0);
  const lastCursorEmitTimeRef = useRef<number>(0);

  // Cache loaded images
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Active status helpers
  const isCurrentToolPen = ['pen', 'fountain', 'pencil', 'brush', 'ballpoint', 'marker'].includes(tool);
  const isCurrentToolEraser = ['eraser', 'object_eraser', 'highlighter_eraser', 'area_eraser'].includes(tool);
  const currentActiveSize = tool === 'highlighter' ? highlighterSize : isCurrentToolEraser ? eraserSize : size;

  const handleSelectPenSubtool = (pType: PenSubType) => {
    setActivePenType(pType);
    setTool(pType);
    setIsPenMenuOpen(false);
    setSelectedStrokeId(null);
  };

  const handleSelectEraserSubtool = (eType: EraserSubType) => {
    setActiveEraserType(eType);
    setTool(eType);
    setIsEraserMenuOpen(false);
    setSelectedStrokeId(null);
  };

  const handleMainPenButtonClick = () => {
    setSelectedStrokeId(null);
    if (!isCurrentToolPen) {
      setTool(activePenType);
    } else {
      setShowToolCustomizer((prev) => !prev);
    }
  };

  const handleMainEraserButtonClick = () => {
    setSelectedStrokeId(null);
    if (!isCurrentToolEraser) {
      setTool(activeEraserType);
    } else {
      setIsEraserMenuOpen((prev) => !prev);
    }
  };

  // Switch to preset from Pen Box
  const handleSelectPenBoxSlot = (slot: PenBoxSlot) => {
    setActivePenBoxId(slot.id);
    setColor(slot.color);
    setOpacity(slot.opacity);
    if (slot.type === 'highlighter') {
      setTool('highlighter');
      setHighlighterSize(slot.size);
    } else {
      setTool(slot.type);
      setActivePenType(slot.type);
      setSize(slot.size);
    }
    setSelectedStrokeId(null);
  };

  // Add current active configuration to Pen Box
  const handleAddCurrentToPenBox = () => {
    const newSlot: PenBoxSlot = {
      id: `p-${Date.now()}`,
      type: tool === 'highlighter' ? 'highlighter' : activePenType,
      color,
      size: tool === 'highlighter' ? highlighterSize : size,
      opacity,
      label: `${(tool === 'highlighter' ? highlighterSize / 20 : size / 3).toFixed(1)}`
    };
    setPenBoxSlots((prev) => [...prev.slice(-5), newSlot]);
    setActivePenBoxId(newSlot.id);
    setShowToolCustomizer(false);
  };

  // Sync strokes from props
  useEffect(() => {
    setLocalStrokes(strokes || []);
  }, [strokes]);

  // Preload any stroke images
  useEffect(() => {
    localStrokes.forEach((s) => {
      if (s.type === 'image' && s.imageUrl && !imageCacheRef.current.has(s.imageUrl)) {
        const img = new Image();
        img.src = s.imageUrl;
        img.onload = () => {
          imageCacheRef.current.set(s.imageUrl!, img);
          redrawCanvas();
        };
      }
    });
  }, [localStrokes]);

  // Calculate accurate stroke bounding box for hit-testing & lasso selection
  const getStrokeBoundingBox = (stroke: WhiteboardStroke) => {
    if (!stroke.points || stroke.points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    if (stroke.type === 'image') {
      const p = stroke.points[0];
      return {
        minX: p.x,
        minY: p.y,
        maxX: p.x + (stroke.imageWidth || 300),
        maxY: p.y + (stroke.imageHeight || 200)
      };
    }

    if (stroke.type === 'note') {
      const p = stroke.points[0];
      const w = stroke.noteWidth || 220;
      const h = stroke.noteHeight || 180;
      return {
        minX: p.x - 4,
        minY: p.y - 4,
        maxX: p.x + w + 4,
        maxY: p.y + h + 4
      };
    }

    if (stroke.type === 'text' && stroke.text) {
      const p = stroke.points[0];
      const fontSize = stroke.fontSize || 24;
      const approxW = stroke.text.length * (fontSize * 0.62);
      return {
        minX: p.x - 6,
        minY: p.y - fontSize - 6,
        maxX: p.x + approxW + 10,
        maxY: p.y + 10
      };
    }

    if (stroke.type === 'circle' && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      const radius = Math.hypot(end.x - start.x, end.y - start.y);
      return {
        minX: start.x - radius - 8,
        minY: start.y - radius - 8,
        maxX: start.x + radius + 8,
        maxY: start.y + radius + 8
      };
    }

    if (stroke.type === 'star' && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      const r = Math.hypot(end.x - start.x, end.y - start.y);
      return {
        minX: start.x - r - 8,
        minY: start.y - r - 8,
        maxX: start.x + r + 8,
        maxY: start.y + r + 8
      };
    }

    if (stroke.type === 'rect' && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      return {
        minX: Math.min(start.x, end.x) - 8,
        minY: Math.min(start.y, end.y) - 8,
        maxX: Math.max(start.x, end.x) + 8,
        maxY: Math.max(start.y, end.y) + 8
      };
    }

    if (['triangle', 'diamond', 'arrow', 'line'].includes(stroke.type) && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      return {
        minX: Math.min(start.x, end.x) - 12,
        minY: Math.min(start.y, end.y) - 12,
        maxX: Math.max(start.x, end.x) + 12,
        maxY: Math.max(start.y, end.y) + 12
      };
    }

    const xs = stroke.points.map((p) => p.x);
    const ys = stroke.points.map((p) => p.y);
    const pad = Math.max(10, stroke.size);
    return {
      minX: Math.min(...xs) - pad,
      minY: Math.min(...ys) - pad,
      maxX: Math.max(...xs) + pad,
      maxY: Math.max(...ys) + pad
    };
  };

  // Redraw canvas with full transform, grids, background, strokes, selection box, and live remote author cursors
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render background
    const isDark = canvasTheme === 'dark';
    ctx.fillStyle = isDark ? '#121212' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply 2D Pan and Zoom
    ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);

    const startX = -pan.x / zoom - 200;
    const endX = (canvas.width - pan.x) / zoom + 200;
    const startY = -pan.y / zoom - 200;
    const endY = (canvas.height - pan.y) / zoom + 200;

    // Background Patterns (Works in BOTH Light and Dark themes)
    if (canvasPattern === 'grid') {
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 122, 255, 0.10)';
      ctx.lineWidth = 1;
      const gridSize = 40;

      for (let x = startX - (startX % gridSize); x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY - (startY % gridSize); y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
      ctx.restore();
    } else if (canvasPattern === 'dots') {
      ctx.save();
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.22)';
      const dotSize = 30;
      for (let x = startX - (startX % dotSize); x <= endX; x += dotSize) {
        for (let y = startY - (startY % dotSize); y <= endY; y += dotSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (canvasPattern === 'lines') {
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 122, 255, 0.14)';
      ctx.lineWidth = 1;
      const lineGap = 32;
      for (let y = startY - (startY % lineGap); y <= endY; y += lineGap) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render all strokes
    for (const stroke of localStrokes) {
      drawSmoothStroke(ctx, stroke, isDark);
    }

    // Selection Bounding Box & Move Overlay
    if (selectedStrokeId) {
      const selected = localStrokes.find((s) => s.id === selectedStrokeId);
      if (selected) {
        const box = getStrokeBoundingBox(selected);
        ctx.save();
        ctx.strokeStyle = '#007AFF';
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([5 / zoom, 4 / zoom]);
        ctx.strokeRect(box.minX, box.minY, box.maxX - box.minX, box.maxY - box.minY);

        // 4 Corner Control Handles
        ctx.setLineDash([]);
        ctx.fillStyle = '#007AFF';
        const handleR = 4.5 / zoom;
        [
          { x: box.minX, y: box.minY },
          { x: box.maxX, y: box.minY },
          { x: box.minX, y: box.maxY },
          { x: box.maxX, y: box.maxY }
        ].forEach((h) => {
          ctx.beginPath();
          ctx.arc(h.x, h.y, handleR, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();
        });

        // Move Pill Indicator at top
        ctx.fillStyle = '#007AFF';
        ctx.beginPath();
        ctx.arc((box.minX + box.maxX) / 2, box.minY - 14 / zoom, handleR * 1.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
    }

    // LIVE REMOTE PARTICIPANT CURSORS & AUTHOR BADGES
    if (remoteCursors && remoteCursors.size > 0) {
      const now = Date.now();
      remoteCursors.forEach((c) => {
        if (now - c.lastUpdated > 3500) return;

        ctx.save();
        const cursorColor = c.isFaculty ? '#007AFF' : '#5856D6';

        // Drawing Ripple
        if (c.isDrawing) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, 10 / zoom, 0, 2 * Math.PI);
          ctx.fillStyle = c.isFaculty ? 'rgba(0, 122, 255, 0.25)' : 'rgba(88, 86, 214, 0.25)';
          ctx.fill();
        }

        // Cursor Stylus Nib Icon
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4 / zoom, 0, 2 * Math.PI);
        ctx.fillStyle = cursorColor;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();

        // Floating Author Name Badge
        const tagText = `${c.userName} ${c.isDrawing ? '✍️' : '✏️'}`;
        const fontSize = Math.max(10, Math.min(14, 12 / zoom));
        ctx.font = `600 ${fontSize}px -apple-system, system-ui, sans-serif`;
        const textMetrics = ctx.measureText(tagText);
        const padX = 6 / zoom;
        const padY = 3 / zoom;
        const badgeW = textMetrics.width + padX * 2;
        const badgeH = fontSize + padY * 2;
        const badgeX = c.x + 8 / zoom;
        const badgeY = c.y - 18 / zoom;

        // Badge pill background
        ctx.fillStyle = cursorColor;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4 / zoom);
        ctx.fill();

        // Badge text
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, badgeX + padX, badgeY + badgeH / 2);

        ctx.restore();
      });
    }

    // Optional Ruler & Coordinate Scale Overlay
    if (showRuler) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.save();
      ctx.fillStyle = isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(242, 242, 247, 0.85)';
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
      ctx.font = '10px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = isDark ? '#AEAEB2' : '#8E8E93';

      // Top Horizontal Ruler
      ctx.fillRect(0, 0, canvas.width, 18);
      ctx.strokeRect(0, 0, canvas.width, 18);
      for (let x = 0; x < canvas.width; x += 50) {
        const worldX = Math.round((x - pan.x) / zoom);
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x, 18);
        ctx.stroke();
        ctx.fillText(`${worldX}`, x + 2, 14);
      }

      // Left Vertical Ruler
      ctx.fillRect(0, 0, 24, canvas.height);
      ctx.strokeRect(0, 0, 24, canvas.height);
      for (let y = 0; y < canvas.height; y += 50) {
        const worldY = Math.round((y - pan.y) / zoom);
        ctx.beginPath();
        ctx.moveTo(16, y);
        ctx.lineTo(24, y);
        ctx.stroke();
        ctx.fillText(`${worldY}`, 2, y + 10);
      }
      ctx.restore();
    }
  }, [localStrokes, selectedStrokeId, zoom, pan, canvasTheme, canvasPattern, showRuler, remoteCursors]);

  // Dynamically size canvas buffer to match its container exactly (eliminates coordinate offset)
  useEffect(() => {
    if (!isOpen) return;

    const updateCanvasSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w === 0 || h === 0) return;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      redrawCanvas();
    };

    updateCanvasSize();
    const ro = new ResizeObserver(() => updateCanvasSize());
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [isOpen, redrawCanvas]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(redrawCanvas, 50);
    }
  }, [isOpen, redrawCanvas]);

  // Periodic redraw to update remote cursor fading
  useEffect(() => {
    if (!isOpen || !remoteCursors || remoteCursors.size === 0) return;
    const interval = setInterval(redrawCanvas, 300);
    return () => clearInterval(interval);
  }, [isOpen, remoteCursors, redrawCanvas]);

  // Comprehensive Stroke & Shape Renderer
  const drawSmoothStroke = (ctx: CanvasRenderingContext2D, stroke: WhiteboardStroke, isDarkBg: boolean) => {
    const points = stroke.points;
    if (!points || points.length === 0) return;

    ctx.save();

    // Base Opacity
    const baseAlpha = stroke.opacity !== undefined ? stroke.opacity / 100 : 1;

    // Handle Text Label Stroke (Direct In-Canvas Text)
    if (stroke.type === 'text' && stroke.text) {
      const p = points[0];
      const fontSize = stroke.fontSize || 24;
      ctx.font = `${stroke.fontStyle === 'bold' ? 'bold' : '500'} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = stroke.color;
      ctx.globalAlpha = baseAlpha;
      ctx.textBaseline = 'top';
      const lines = stroke.text.split('\n');
      lines.forEach((l, idx) => {
        ctx.fillText(l, p.x, p.y + idx * (fontSize * 1.25));
      });
      ctx.restore();
      return;
    }

    // Handle Image Stroke
    if (stroke.type === 'image' && stroke.imageUrl) {
      const img = imageCacheRef.current.get(stroke.imageUrl);
      const p = points[0];
      const w = stroke.imageWidth || 300;
      const h = stroke.imageHeight || 200;
      if (img && img.complete) {
        ctx.drawImage(img, p.x, p.y, w, h);
      }
      ctx.restore();
      return;
    }
    // 1. HIGHLIGHTER (Unified Single-Path Ribbon — 0 Overlap Beads)
    if (stroke.type === 'highlighter') {
      ctx.globalCompositeOperation = isDarkBg ? 'screen' : 'multiply';
      ctx.globalAlpha = 0.35 * baseAlpha;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (points.length === 1) {
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, 2 * Math.PI);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const midX = (points[i].x + points[i + 1].x) / 2;
          const midY = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
      }

      ctx.restore();
      return;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.type === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = isDarkBg ? '#121212' : '#FFFFFF';
      ctx.lineWidth = stroke.size * 2.5;
    } else if (stroke.type === 'ballpoint') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.95 * baseAlpha;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(1, stroke.size);
    } else if (stroke.type === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.7 * baseAlpha;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(1, stroke.size * 0.75);
    } else if (stroke.type === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.9 * baseAlpha;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * 1.5;
    } else if (stroke.type === 'fountain') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = baseAlpha;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
    } else if (stroke.type === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.65 * baseAlpha;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * 1.4;
      ctx.shadowColor = stroke.color;
      ctx.shadowBlur = 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = baseAlpha;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
    }

    // Shapes Rendering
    if (stroke.type === 'rect' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (stroke.type === 'circle' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      const radius = Math.hypot(end.x - start.x, end.y - start.y);
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (stroke.type === 'triangle' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      const midX = (start.x + end.x) / 2;
      ctx.beginPath();
      ctx.moveTo(midX, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(start.x, end.y);
      ctx.closePath();
      ctx.stroke();
    } else if (stroke.type === 'diamond' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      ctx.beginPath();
      ctx.moveTo(midX, start.y);
      ctx.lineTo(end.x, midY);
      ctx.lineTo(midX, end.y);
      ctx.lineTo(start.x, midY);
      ctx.closePath();
      ctx.stroke();
    } else if (stroke.type === 'star' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      const r = Math.hypot(end.x - start.x, end.y - start.y);
      const spikes = 5;
      const step = Math.PI / spikes;
      ctx.beginPath();
      for (let i = 0; i < 2 * spikes; i++) {
        const radius = i % 2 === 0 ? r : r / 2;
        const angle = i * step - Math.PI / 2;
        const x = start.x + radius * Math.cos(angle);
        const y = start.y + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (stroke.type === 'line' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (stroke.type === 'arrow' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLen = Math.max(12, stroke.size * 3);

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    } else if (points.length === 1) {
      const p = points[0];
      const pressure = p.pressure ?? 0.5;
      const r = (stroke.size * (0.4 + pressure * 0.8)) / 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, r), 0, 2 * Math.PI);
      ctx.fillStyle = stroke.type === 'eraser' ? (isDarkBg ? '#121212' : '#FFFFFF') : stroke.color;
      ctx.fill();
    } else if (stroke.type === 'fountain' || stroke.type === 'brush') {
      // ── Calligraphic Liquid Ink Fountain Pen & Brush Ribbon ──
      const isFountain = stroke.type === 'fountain';
      const pFactor = pressureSensitivity / 100;
      const leftPts: WhiteboardPoint[] = [];
      const rightPts: WhiteboardPoint[] = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const next = points[i + 1] || p;
        const prev = points[i - 1] || p;
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const angle = Math.atan2(dy, dx);
        const perp = angle + Math.PI / 2;

        const pressure = p.pressure ?? 0.5;
        let halfW = stroke.size / 2;

        if (isFountain) {
          const angleMod = 0.35 + 0.65 * Math.abs(Math.sin(angle - Math.PI / 4));
          halfW = Math.max(0.75, (stroke.size / 2) * (0.35 + 1.2 * angleMod * (0.5 + 0.9 * pressure * pFactor)));
        } else {
          halfW = Math.max(1, (stroke.size / 2) * (0.3 + 1.5 * pressure * pFactor));
        }

        leftPts.push({
          x: p.x + Math.cos(perp) * halfW,
          y: p.y + Math.sin(perp) * halfW
        });
        rightPts.push({
          x: p.x - Math.cos(perp) * halfW,
          y: p.y - Math.sin(perp) * halfW
        });
      }

      ctx.beginPath();
      ctx.fillStyle = stroke.color;
      ctx.moveTo(leftPts[0].x, leftPts[0].y);

      for (let i = 1; i < leftPts.length - 1; i++) {
        const midX = (leftPts[i].x + leftPts[i + 1].x) / 2;
        const midY = (leftPts[i].y + leftPts[i + 1].y) / 2;
        ctx.quadraticCurveTo(leftPts[i].x, leftPts[i].y, midX, midY);
      }
      ctx.lineTo(leftPts[leftPts.length - 1].x, leftPts[leftPts.length - 1].y);
      ctx.lineTo(rightPts[rightPts.length - 1].x, rightPts[rightPts.length - 1].y);

      for (let i = rightPts.length - 2; i >= 1; i--) {
        const midX = (rightPts[i].x + rightPts[i - 1].x) / 2;
        const midY = (rightPts[i].y + rightPts[i - 1].y) / 2;
        ctx.quadraticCurveTo(rightPts[i].x, rightPts[i].y, midX, midY);
      }
      ctx.lineTo(rightPts[0].x, rightPts[0].y);
      ctx.closePath();
      ctx.fill();

      // Rounded caps at stroke start & end
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, Math.max(0.8, stroke.size * 0.25), 0, 2 * Math.PI);
      ctx.arc(points[points.length - 1].x, points[points.length - 1].y, Math.max(0.8, stroke.size * 0.25), 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // ── Ultra-Smooth Continuous Spline for Ink Pen, Ballpoint, Pencil & Eraser ──
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      if (points.length === 2) {
        ctx.lineTo(points[1].x, points[1].y);
      } else {
        for (let i = 1; i < points.length - 1; i++) {
          const midX = (points[i].x + points[i + 1].x) / 2;
          const midY = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  };

  // Convert Pointer Screen coordinates to Virtual World coordinates with Pressure Calculation
  const getCanvasWorldCoords = (e: React.PointerEvent<HTMLCanvasElement>): WhiteboardPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const worldX = (clientX - pan.x) / zoom;
    const worldY = (clientY - pan.y) / zoom;

    let computedPressure = 0.5;

    if (pressureMode === 'stylus') {
      if (e.pointerType === 'pen' && e.pressure > 0) {
        computedPressure = e.pressure;
      } else if (e.pointerType === 'touch') {
        computedPressure = e.pressure > 0 ? e.pressure : 0.6;
      } else {
        computedPressure = 0.5;
      }
    } else if (pressureMode === 'speed') {
      const now = Date.now();
      const dt = Math.max(1, now - (lastPointTimeRef.current || now));
      const lastPt = currentPointsRef.current[currentPointsRef.current.length - 1];
      if (lastPt) {
        const dist = Math.hypot(worldX - lastPt.x, worldY - lastPt.y);
        const speed = dist / dt;
        computedPressure = Math.max(0.2, Math.min(1.0, 1.2 - speed * 0.4));
      }
      lastPointTimeRef.current = now;
    } else {
      computedPressure = 0.5;
    }

    return {
      x: worldX,
      y: worldY,
      pressure: computedPressure
    };
  };

  // Undo and Redo operations
  const handleUndo = useCallback(() => {
    if (localStrokes.length === 0) return;
    const last = localStrokes[localStrokes.length - 1];
    const newStrokes = localStrokes.slice(0, -1);
    setRedoStack((prev) => [...prev, last]);
    setLocalStrokes(newStrokes);
    setSelectedStrokeId(null);
  }, [localStrokes]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setLocalStrokes((prev) => [...prev, last]);
    onEmitStroke(last);
  }, [redoStack, onEmitStroke]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
          return;
        }
        if (textInputPos) {
          setTextInputPos(null);
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedStrokeId && !textInputPos) {
          const removed = localStrokes.find((s) => s.id === selectedStrokeId);
          if (removed) {
            setRedoStack((prev) => [...prev, removed]);
            setLocalStrokes((prev) => prev.filter((s) => s.id !== selectedStrokeId));
            setSelectedStrokeId(null);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleUndo, handleRedo, selectedStrokeId, localStrokes, isFullscreen, textInputPos]);

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    // Pan canvas with middle click, spacebar or 'pan' tool
    if (tool === 'pan' || e.button === 1 || e.buttons === 4) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    lastPointTimeRef.current = Date.now();
    const startPoint = getCanvasWorldCoords(e);

    // Broadcast cursor position
    onEmitCursor?.(startPoint.x, startPoint.y, true);

    // 1. TEXT TOOL: Spawn in-place canvas text placement
    if (tool === 'text') {
      setTextInputPos(startPoint);
      setTextInputString('');
      return;
    }

    // 2. SELECT & MOVE TOOL: Find and drag shape/stroke
    if (tool === 'select') {
      const hitStroke = [...localStrokes].reverse().find((s) => {
        const box = getStrokeBoundingBox(s);
        return (
          startPoint.x >= box.minX &&
          startPoint.x <= box.maxX &&
          startPoint.y >= box.minY &&
          startPoint.y <= box.maxY
        );
      });

      if (hitStroke) {
        setSelectedStrokeId(hitStroke.id);
        setIsDraggingSelected(true);
        dragStartRef.current = startPoint;
        initialStrokeSnapshotRef.current = JSON.parse(JSON.stringify(hitStroke));
      } else {
        setSelectedStrokeId(null);
        setIsDraggingSelected(false);
        initialStrokeSnapshotRef.current = null;
      }
      return;
    }

    // 3. OBJECT ERASER: 1-click deletion of entire stroke / shape
    if (tool === 'object_eraser') {
      const targetIndex = localStrokes.findIndex((s) => {
        const box = getStrokeBoundingBox(s);
        return (
          startPoint.x >= box.minX &&
          startPoint.x <= box.maxX &&
          startPoint.y >= box.minY &&
          startPoint.y <= box.maxY
        );
      });
      if (targetIndex !== -1) {
        const removed = localStrokes[targetIndex];
        setRedoStack((prev) => [...prev, removed]);
        setLocalStrokes((prev) => prev.filter((_, idx) => idx !== targetIndex));
        if (selectedStrokeId === removed.id) setSelectedStrokeId(null);
      }
      return;
    }

    // 4. HIGHLIGHTER-ONLY ERASER: 1-click deletion of highlighter strokes only
    if (tool === 'highlighter_eraser') {
      const targetIndex = localStrokes.findIndex((s) => {
        if (s.type !== 'highlighter') return false;
        const box = getStrokeBoundingBox(s);
        return (
          startPoint.x >= box.minX &&
          startPoint.x <= box.maxX &&
          startPoint.y >= box.minY &&
          startPoint.y <= box.maxY
        );
      });
      if (targetIndex !== -1) {
        const removed = localStrokes[targetIndex];
        setRedoStack((prev) => [...prev, removed]);
        setLocalStrokes((prev) => prev.filter((_, idx) => idx !== targetIndex));
      }
      return;
    }

    // 5. AREA LASSO ERASER or NORMAL DRAWING
    const strokeType = (tool === 'area_eraser' ? 'rect' : tool) as WhiteboardStroke['type'];
    const strokeSize = strokeType === 'highlighter' ? highlighterSize : isCurrentToolEraser ? eraserSize : size;

    setIsDrawing(true);
    currentPointsRef.current = [startPoint];

    // Live preview
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const activeStroke: WhiteboardStroke = {
        id: `temp-${Date.now()}`,
        type: strokeType,
        color: tool === 'area_eraser' ? 'rgba(255, 59, 48, 0.4)' : color,
        size: strokeSize,
        opacity,
        points: [startPoint]
      };
      ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
      drawSmoothStroke(ctx, activeStroke, canvasTheme === 'dark');
    }
  };

  // Pointer Move (Throttled Cursor Broadcast & Decimated Points)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    const pt = getCanvasWorldCoords(e);

    // Low bandwidth cursor broadcast (max 25fps / 40ms)
    const now = Date.now();
    if (now - lastCursorEmitTimeRef.current > 40) {
      onEmitCursor?.(pt.x, pt.y, isDrawing);
      lastCursorEmitTimeRef.current = now;
    }

    // Dragging Selected Shape/Stroke Across Canvas
    if (tool === 'select' && isDraggingSelected && selectedStrokeId && initialStrokeSnapshotRef.current) {
      const dx = pt.x - dragStartRef.current.x;
      const dy = pt.y - dragStartRef.current.y;
      const initial = initialStrokeSnapshotRef.current;

      const movedPoints = initial.points.map((p) => ({
        x: p.x + dx,
        y: p.y + dy,
        pressure: p.pressure
      }));

      setLocalStrokes((prev) =>
        prev.map((s) => (s.id === selectedStrokeId ? { ...s, points: movedPoints } : s))
      );
      return;
    }

    if (!isDrawing) return;

    // Point decimation: skip redundant jitter points within 1.5px
    const lastPt = currentPointsRef.current[currentPointsRef.current.length - 1];
    if (lastPt && Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) < 1.5) {
      return;
    }

    currentPointsRef.current.push(pt);

    const isShape = ['rect', 'circle', 'triangle', 'diamond', 'star', 'arrow', 'line', 'area_eraser'].includes(tool);
    const strokeType = (tool === 'area_eraser' ? 'rect' : tool) as WhiteboardStroke['type'];
    const strokeSize = strokeType === 'highlighter' ? highlighterSize : isCurrentToolEraser ? eraserSize : size;

    if (isShape) {
      redrawCanvas();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const shapeStroke: WhiteboardStroke = {
          id: `preview-${Date.now()}`,
          type: strokeType,
          color: tool === 'area_eraser' ? 'rgba(255, 59, 48, 0.4)' : color,
          size: strokeSize,
          opacity,
          points: [currentPointsRef.current[0], pt]
        };
        ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
        drawSmoothStroke(ctx, shapeStroke, canvasTheme === 'dark');
      }
    } else {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const activeStroke: WhiteboardStroke = {
          id: `temp-${Date.now()}`,
          type: strokeType,
          color,
          size: strokeSize,
          opacity,
          points: currentPointsRef.current
        };
        ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
        drawSmoothStroke(ctx, activeStroke, canvasTheme === 'dark');
      }
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // Finished Dragging Selected Shape -> Sync with room
    if (tool === 'select' && isDraggingSelected && selectedStrokeId && initialStrokeSnapshotRef.current) {
      setIsDraggingSelected(false);
      const pt = getCanvasWorldCoords(e);
      const dx = pt.x - dragStartRef.current.x;
      const dy = pt.y - dragStartRef.current.y;
      const initial = initialStrokeSnapshotRef.current;
      const movedPoints = initial.points.map((p) => ({
        x: p.x + dx,
        y: p.y + dy,
        pressure: p.pressure
      }));
      const movedStroke: WhiteboardStroke = {
        ...initial,
        points: movedPoints
      };
      setLocalStrokes((prev) =>
        prev.map((s) => (s.id === selectedStrokeId ? movedStroke : s))
      );
      onEmitStroke(movedStroke);
      initialStrokeSnapshotRef.current = null;
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    // Area Lasso Eraser Completion -> Delete all strokes enclosed or intersecting
    if (tool === 'area_eraser' && currentPointsRef.current.length >= 2) {
      const start = currentPointsRef.current[0];
      const end = currentPointsRef.current[currentPointsRef.current.length - 1];
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);

      setLocalStrokes((prev) =>
        prev.filter((s) => {
          const box = getStrokeBoundingBox(s);
          const isIntersecting =
            box.minX <= maxX &&
            box.maxX >= minX &&
            box.minY <= maxY &&
            box.maxY >= minY;
          return !isIntersecting;
        })
      );
      currentPointsRef.current = [];
      redrawCanvas();
      return;
    }

    // Normal Stroke Completion
    if (currentPointsRef.current.length > 0) {
      const strokeType = tool as WhiteboardStroke['type'];
      const strokeSize = strokeType === 'highlighter' ? highlighterSize : isCurrentToolEraser ? eraserSize : size;
      const finalStroke: WhiteboardStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: strokeType,
        color,
        size: strokeSize,
        opacity,
        points: [...currentPointsRef.current]
      };

      setLocalStrokes((prev) => [...prev, finalStroke]);
      setRedoStack([]);
      onEmitStroke(finalStroke);
    }

    currentPointsRef.current = [];
  };

  // Submit Text Note onto Canvas
  const handleCommitText = () => {
    if (!textInputPos || !textInputString.trim()) {
      setTextInputPos(null);
      return;
    }
    const textStroke: WhiteboardStroke = {
      id: `txt-${Date.now()}`,
      type: 'text',
      color,
      size: 1,
      opacity,
      points: [textInputPos],
      text: textInputString.trim(),
      fontSize: textFontSize,
      fontStyle: isTextBold ? 'bold' : 'normal'
    };

    setLocalStrokes((prev) => [...prev, textStroke]);
    onEmitStroke(textStroke);
    setSelectedStrokeId(textStroke.id);
    setTextInputPos(null);
    setTextInputString('');
    setTool('select');
  };

  // Zoom Controls
  const handleZoomIn = () => setZoom((prev) => Math.min(3, prev + 0.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.4, prev - 0.2));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Insert Image onto Canvas
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const aspect = img.width / img.height;
        const width = 360;
        const height = width / aspect;

        const canvas = canvasRef.current;
        const centerX = canvas ? (canvas.width / 2 - pan.x) / zoom - width / 2 : 100;
        const centerY = canvas ? (canvas.height / 2 - pan.y) / zoom - height / 2 : 100;

        const imageStroke: WhiteboardStroke = {
          id: `img-${Date.now()}`,
          type: 'image',
          color: '#000000',
          size: 1,
          points: [{ x: centerX, y: centerY }],
          imageUrl: dataUrl,
          imageWidth: width,
          imageHeight: height
        };

        imageCacheRef.current.set(dataUrl, img);
        setLocalStrokes((prev) => [...prev, imageStroke]);
        onEmitStroke(imageStroke);
        setSelectedStrokeId(imageStroke.id);
        setTool('select');
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Export as High-DPI PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.fillStyle = canvasTheme === 'dark' ? '#121212' : '#FFFFFF';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `whiteboard-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Broadcast Snapshot to Room Files
  const handleBroadcastSnapshot = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `whiteboard-snapshot-${Date.now()}.png`, { type: 'image/png' });
        await onBroadcastImage(file);
        alert('Whiteboard snapshot broadcasted to Room Files!');
      }
    }, 'image/png');
  };

  if (!isOpen) return null;

  const currentPenMeta = PEN_TOOLS.find((p) => p.id === activePenType) || PEN_TOOLS[0];
  const currentEraserMeta = ERASER_TOOLS.find((e) => e.id === activeEraserType) || ERASER_TOOLS[0];
  const ActivePenIcon = currentPenMeta.icon;
  const ActiveEraserIcon = currentEraserMeta.icon;

  // Render Inner Studio Toolbar & Controls
  // Render Clean Top Utility Bar (Background Theme, Undo/Redo, Zoom, Share, Export, Clear)
  const renderStudioToolbar = () => (
    <>
      <div className="shrink-0 flex items-center justify-between gap-2 p-1.5 bg-apple-secondaryBg/90 dark:bg-white/5 rounded-2xl border border-apple-border/70 dark:border-white/10 shadow-2xs select-none">
      {/* Left: History & Alignment (Undo, Redo, Ruler) */}
      <div className="flex items-center gap-0.5 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-xs shrink-0">
        <button
          type="button"
          onClick={handleUndo}
          disabled={localStrokes.length === 0}
          className="p-1.5 rounded-lg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white disabled:opacity-30 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="p-1.5 rounded-lg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white disabled:opacity-30 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="w-px h-3.5 bg-apple-border/60 dark:bg-white/10 mx-0.5" />
        <button
          type="button"
          onClick={() => setShowRuler(!showRuler)}
          className={`p-1.5 rounded-lg transition-colors ${
            showRuler
              ? 'bg-apple-blue text-white shadow-2xs'
              : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
          }`}
          title="Toggle Precision Ruler"
        >
          <Ruler className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Canvas Theme & Background Pattern Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsCanvasSettingsOpen(!isCanvasSettingsOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C1C1E] border shadow-xs text-xs font-semibold transition-all whitespace-nowrap ${
            isCanvasSettingsOpen
              ? 'border-apple-blue text-apple-blue ring-2 ring-apple-blue/20'
              : 'border-apple-border/70 dark:border-white/10 text-apple-textPrimary dark:text-white hover:border-apple-blue/50'
          }`}
          title="Canvas Background & Theme Settings"
        >
          {canvasTheme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
          <span className="capitalize whitespace-nowrap font-medium">
            {canvasTheme} &bull; {canvasPattern}
          </span>
          <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
        </button>

        {isCanvasSettingsOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white dark:bg-[#1C1C1E] border border-apple-border/80 dark:border-white/15 rounded-2xl shadow-2xl p-3 z-50 w-56 space-y-3 animate-scale-up">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-apple-textSecondary dark:text-white/50 block mb-1.5">
                Color Mode
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCanvasTheme('light');
                    setIsCanvasSettingsOpen(false);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-caption font-semibold transition-all ${
                    canvasTheme === 'light'
                      ? 'bg-apple-blue text-white shadow-xs'
                      : 'bg-apple-secondaryBg dark:bg-white/5 text-apple-textPrimary dark:text-white hover:bg-apple-tertiaryBg'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCanvasTheme('dark');
                    setIsCanvasSettingsOpen(false);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-caption font-semibold transition-all ${
                    canvasTheme === 'dark'
                      ? 'bg-apple-blue text-white shadow-xs'
                      : 'bg-apple-secondaryBg dark:bg-white/5 text-apple-textPrimary dark:text-white hover:bg-apple-tertiaryBg'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            <div className="border-t border-apple-border/40 dark:border-white/10 pt-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-apple-textSecondary dark:text-white/50 block mb-1.5">
                Grid Pattern
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCanvasPattern('plain');
                    setIsCanvasSettingsOpen(false);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-caption font-semibold transition-all text-center ${
                    canvasPattern === 'plain'
                      ? 'bg-apple-blue text-white shadow-xs'
                      : 'bg-apple-secondaryBg dark:bg-white/5 text-apple-textPrimary dark:text-white hover:bg-apple-tertiaryBg'
                  }`}
                >
                  Plain
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCanvasPattern('grid');
                    setIsCanvasSettingsOpen(false);
                  }}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-caption font-semibold transition-all ${
                    canvasPattern === 'grid'
                      ? 'bg-apple-blue text-white shadow-xs'
                      : 'bg-apple-secondaryBg dark:bg-white/5 text-apple-textPrimary dark:text-white hover:bg-apple-tertiaryBg'
                  }`}
                >
                  <Grid className="w-3 h-3" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCanvasPattern('dots');
                    setIsCanvasSettingsOpen(false);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-caption font-semibold transition-all text-center ${
                    canvasPattern === 'dots'
                      ? 'bg-apple-blue text-white shadow-xs'
                      : 'bg-apple-secondaryBg dark:bg-white/5 text-apple-textPrimary dark:text-white hover:bg-apple-tertiaryBg'
                  }`}
                >
                  Dots
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCanvasPattern('lines');
                    setIsCanvasSettingsOpen(false);
                  }}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-caption font-semibold transition-all ${
                    canvasPattern === 'lines'
                      ? 'bg-apple-blue text-white shadow-xs'
                      : 'bg-apple-secondaryBg dark:bg-white/5 text-apple-textPrimary dark:text-white hover:bg-apple-tertiaryBg'
                  }`}
                >
                  <Minus className="w-3 h-3" />
                  <span>Lines</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Zoom & Canvas Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 bg-white dark:bg-[#1C1C1E] p-0.5 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-xs">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="px-2 py-0.5 rounded-lg text-caption font-mono font-semibold text-apple-textSecondary hover:text-apple-blue transition-colors"
            title="Reset Zoom & Pan"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Insert Image */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white transition-colors border border-apple-border/60 dark:border-white/10 shadow-xs"
          title="Insert Image / Diagram"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* Broadcast to Room Files */}
        <button
          type="button"
          onClick={handleBroadcastSnapshot}
          className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-blue transition-colors border border-apple-border/60 dark:border-white/10 shadow-xs"
          title="Share Snapshot to Room Files"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Export PNG */}
        <button
          type="button"
          onClick={handleExportPNG}
          className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white transition-colors border border-apple-border/60 dark:border-white/10 shadow-xs"
          title="Save as PNG"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Full Screen Toggle */}
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={`p-2 rounded-xl transition-colors border shadow-xs ${
            isFullscreen
              ? 'bg-apple-blue text-white border-apple-blue'
              : 'bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white border border-apple-border/60 dark:border-white/10'
          }`}
          title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Mode'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Clear Canvas */}
        <button
          type="button"
          onClick={() => setConfirmClearOpen(true)}
          className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-red-50 dark:hover:bg-red-950/50 text-apple-red transition-colors border border-apple-border/60 dark:border-white/10 shadow-xs"
          title="Clear Entire Canvas"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>

      {/* Pen Studio Popover Modal */}
      {showToolCustomizer && (
        <div className="shrink-0 p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-apple-border/80 dark:border-white/15 shadow-2xl space-y-3.5 animate-scale-up max-w-xl">
          <div className="flex items-center justify-between border-b border-apple-border/40 dark:border-white/10 pb-2">
            <span className="font-bold text-footnote text-apple-textPrimary dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-apple-blue" />
              <span>Pen Studio</span>
            </span>
            <span className="text-caption font-mono text-apple-blue font-bold">
              {currentPenMeta.label}
            </span>
          </div>

          {/* Visual 3D Nib Selector Row */}
          <div className="grid grid-cols-6 gap-2">
            {PEN_TOOLS.map((p) => {
              const Icon = p.icon;
              const isSelected = activePenType === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPenSubtool(p.id)}
                  className={`p-2.5 rounded-xl flex flex-col items-center gap-1.5 transition-all border ${
                    isSelected
                      ? 'bg-apple-blue/10 border-apple-blue text-apple-blue shadow-2xs font-bold'
                      : 'bg-apple-secondaryBg dark:bg-white/5 border-transparent text-apple-textSecondary hover:text-apple-textPrimary'
                  }`}
                  title={p.desc}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] leading-none text-center truncate w-full">{p.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* 1. Pressure Sensitivity Slider */}
          <div className="flex items-center justify-between gap-3 text-caption font-semibold">
            <span className="text-apple-textSecondary dark:text-white/70 w-32">Pressure Sensitivity:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={pressureSensitivity}
              onChange={(e) => setPressureSensitivity(parseInt(e.target.value, 10))}
              className="flex-1 accent-apple-blue cursor-pointer"
            />
            <span className="w-10 font-mono text-right text-apple-textPrimary dark:text-white">{pressureSensitivity}%</span>
          </div>

          {/* 2. Thickness Slider */}
          <div className="flex items-center justify-between gap-3 text-caption font-semibold">
            <span className="text-apple-textSecondary dark:text-white/70 w-32">Stroke Thickness:</span>
            <input
              type="range"
              min="1"
              max="48"
              value={tool === 'highlighter' ? highlighterSize : size}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (tool === 'highlighter') setHighlighterSize(val);
                else setSize(val);
              }}
              className="flex-1 accent-apple-blue cursor-pointer"
            />
            <span className="w-10 font-mono text-right text-apple-textPrimary dark:text-white">{tool === 'highlighter' ? highlighterSize : size}px</span>
          </div>

          {/* 3. Quick Color Swatches Row */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-apple-border/40 dark:border-white/10">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {APPLE_PALETTE.map((c) => {
                const isSelected = color.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`w-6 h-6 rounded-full transition-all shrink-0 flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-apple-blue ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddCurrentToPenBox}
              className="px-3.5 py-1.5 rounded-xl bg-apple-blue hover:bg-apple-blueHover text-white font-bold text-caption shadow-sm transition-all shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Pen Box</span>
            </button>
          </div>
        </div>
      )}
    </>
  );

  // Render Canvas Component
  const renderCanvasViewport = () => (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-0 w-full bg-white dark:bg-black rounded-2xl overflow-hidden border border-apple-border/80 dark:border-white/10 shadow-inner flex items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full h-full block touch-none ${
          tool === 'pan' || isPanning
            ? 'cursor-grab active:cursor-grabbing'
            : tool === 'select'
            ? isDraggingSelected
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : isCurrentToolEraser
            ? 'cursor-cell'
            : tool === 'text'
            ? 'cursor-text'
            : 'cursor-crosshair'
        }`}
      />

      {/* Direct MS Paint / Figma-Style In-Canvas Text Editor */}
      {textInputPos && (
        <div
          style={{
            position: 'absolute',
            left: `${textInputPos.x * zoom + pan.x}px`,
            top: `${textInputPos.y * zoom + pan.y}px`,
            zIndex: 60
          }}
          className="animate-scale-up select-none flex flex-col items-start gap-1"
        >
          {/* Mini Formatting Toolbar (Size, Bold, Done) */}
          <div className="flex items-center gap-1.5 p-1 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md rounded-xl border border-apple-border/80 dark:border-white/20 shadow-xl text-caption">
            <div className="flex items-center gap-0.5">
              {[14, 20, 28, 40].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setTextFontSize(s)}
                  className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] font-semibold transition-all ${
                    textFontSize === s ? 'bg-apple-blue text-white shadow-2xs' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="w-px h-3.5 bg-apple-border dark:bg-white/10" />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsTextBold(!isTextBold)}
              className={`w-6 h-6 rounded-lg font-bold text-[12px] flex items-center justify-center transition-all ${
                isTextBold ? 'bg-apple-blue text-white shadow-2xs' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
              }`}
              title="Toggle Bold"
            >
              B
            </button>

            <div className="w-px h-3.5 bg-apple-border dark:bg-white/10" />

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCommitText}
              className="p-1 rounded-lg bg-apple-blue text-white hover:bg-apple-blueHover transition-colors shadow-2xs"
              title="Commit Text (Enter)"
            >
              <Check className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setTextInputPos(null)}
              className="p-1 rounded-lg hover:bg-apple-secondaryBg dark:hover:bg-white/10 text-apple-textSecondary transition-colors"
              title="Cancel (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Inline Canvas Text Input (MS Paint style) */}
          <textarea
            autoFocus
            rows={1}
            value={textInputString}
            onChange={(e) => {
              setTextInputString(e.target.value);
              // Auto-expand height
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onBlur={handleCommitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCommitText();
              }
              if (e.key === 'Escape') {
                setTextInputPos(null);
              }
            }}
            placeholder="Type text here..."
            style={{
              color: color,
              fontSize: `${Math.max(12, textFontSize * zoom)}px`,
              fontWeight: isTextBold ? 'bold' : 'normal',
              lineHeight: 1.25,
              minWidth: '140px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
            className="bg-transparent border-2 border-dashed border-apple-blue dark:border-blue-400/80 rounded-md p-1.5 outline-none resize-none shadow-sm"
          />
        </div>
      )}

      {/* Unified Apple Freeform-Style Floating Studio Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-1.5 p-1.5 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-2xl border border-apple-border/80 dark:border-white/20 shadow-2xl select-none max-w-[95vw] overflow-x-auto no-scrollbar">
        {/* 1. Core Drawing Tools */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Select Tool */}
          <button
            type="button"
            onClick={() => {
              setTool('select');
              setIsPenMenuOpen(false);
              setIsEraserMenuOpen(false);
              setIsShapeMenuOpen(false);
            }}
            className={`p-2 rounded-xl transition-all ${
              tool === 'select'
                ? 'bg-apple-blue text-white shadow-xs font-semibold'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
            }`}
            title="Select & Move Shape"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>

          {/* Pen Tool with Nib Subtype Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={handleMainPenButtonClick}
              className={`p-2 rounded-xl transition-all flex items-center gap-1 ${
                isCurrentToolPen
                  ? 'bg-apple-blue text-white shadow-xs'
                  : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
              }`}
              title={`Pen: ${currentPenMeta.label}`}
            >
              <ActivePenIcon className="w-4 h-4" />
              <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </button>

            {isPenMenuOpen && (
              <div className="absolute left-0 bottom-full mb-2 bg-white dark:bg-[#1C1C1E] border border-apple-border/80 dark:border-white/15 rounded-2xl shadow-2xl p-2 z-50 w-56 space-y-1 animate-scale-up">
                <div className="px-2 py-1 border-b border-apple-border/40 dark:border-white/10 text-caption font-bold uppercase tracking-wider text-apple-textSecondary dark:text-white/50">
                  Pen Nib Styles
                </div>
                {PEN_TOOLS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = activePenType === p.id && isCurrentToolPen;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPenSubtool(p.id)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-apple-blue text-white font-semibold shadow-2xs'
                          : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="overflow-hidden">
                        <div className="text-footnote font-semibold">{p.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Highlighter */}
          <button
            type="button"
            onClick={() => {
              setTool('highlighter');
              setSelectedStrokeId(null);
              setIsPenMenuOpen(false);
              setIsEraserMenuOpen(false);
              setIsShapeMenuOpen(false);
            }}
            className={`p-2 rounded-xl transition-all ${
              tool === 'highlighter'
                ? 'bg-apple-blue text-white shadow-xs'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
            }`}
            title="Neon Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          {/* Multi-Eraser Suite */}
          <div className="relative">
            <button
              type="button"
              onClick={handleMainEraserButtonClick}
              className={`p-2 rounded-xl transition-all flex items-center gap-1 ${
                isCurrentToolEraser
                  ? 'bg-apple-blue text-white shadow-xs'
                  : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
              }`}
              title={`Eraser: ${currentEraserMeta.label}`}
            >
              <ActiveEraserIcon className="w-4 h-4" />
              <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </button>

            {isEraserMenuOpen && (
              <div className="absolute left-0 bottom-full mb-2 bg-white dark:bg-[#1C1C1E] border border-apple-border/80 dark:border-white/15 rounded-2xl shadow-2xl p-2 z-50 w-56 space-y-1 animate-scale-up">
                <div className="px-2 py-1 border-b border-apple-border/40 dark:border-white/10 text-caption font-bold uppercase tracking-wider text-apple-textSecondary dark:text-white/50">
                  Eraser Modes
                </div>
                {ERASER_TOOLS.map((e) => {
                  const Icon = e.icon;
                  const isSelected = activeEraserType === e.id && isCurrentToolEraser;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => handleSelectEraserSubtool(e.id)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-apple-blue text-white font-semibold shadow-2xs'
                          : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="overflow-hidden">
                        <div className="text-footnote font-semibold">{e.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shapes Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsShapeMenuOpen(!isShapeMenuOpen)}
              className={`p-2 rounded-xl transition-all flex items-center gap-1 ${
                ['rect', 'circle', 'triangle', 'diamond', 'star', 'arrow', 'line'].includes(tool)
                  ? 'bg-apple-blue text-white shadow-xs font-semibold'
                  : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
              }`}
              title="Geometric Shapes"
            >
              <Square className="w-4 h-4" />
              <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </button>

            {isShapeMenuOpen && (
              <div className="absolute left-0 bottom-full mb-2 bg-white dark:bg-[#1C1C1E] border border-apple-border/80 dark:border-white/15 rounded-2xl shadow-2xl p-2 z-50 w-44 grid grid-cols-2 gap-1 animate-scale-up">
                <button
                  type="button"
                  onClick={() => {
                    setTool('rect');
                    setIsShapeMenuOpen(false);
                    setSelectedStrokeId(null);
                  }}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-caption font-semibold ${
                    tool === 'rect' ? 'bg-apple-blue text-white' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Rect</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTool('circle');
                    setIsShapeMenuOpen(false);
                    setSelectedStrokeId(null);
                  }}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-caption font-semibold ${
                    tool === 'circle' ? 'bg-apple-blue text-white' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                  }`}
                >
                  <Circle className="w-3.5 h-3.5" />
                  <span>Circle</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTool('triangle');
                    setIsShapeMenuOpen(false);
                    setSelectedStrokeId(null);
                  }}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-caption font-semibold ${
                    tool === 'triangle' ? 'bg-apple-blue text-white' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                  }`}
                >
                  <Triangle className="w-3.5 h-3.5" />
                  <span>Triangle</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTool('diamond');
                    setIsShapeMenuOpen(false);
                    setSelectedStrokeId(null);
                  }}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-caption font-semibold ${
                    tool === 'diamond' ? 'bg-apple-blue text-white' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Diamond</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTool('arrow');
                    setIsShapeMenuOpen(false);
                    setSelectedStrokeId(null);
                  }}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-caption font-semibold ${
                    tool === 'arrow' ? 'bg-apple-blue text-white' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Arrow</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTool('line');
                    setIsShapeMenuOpen(false);
                    setSelectedStrokeId(null);
                  }}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-caption font-semibold ${
                    tool === 'line' ? 'bg-apple-blue text-white' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Line</span>
                </button>
              </div>
            )}
          </div>

          {/* Text Tool */}
          <button
            type="button"
            onClick={() => {
              setTool('text');
              setSelectedStrokeId(null);
              setIsPenMenuOpen(false);
              setIsEraserMenuOpen(false);
              setIsShapeMenuOpen(false);
            }}
            className={`p-2 rounded-xl transition-all ${
              tool === 'text'
                ? 'bg-apple-blue text-white shadow-xs'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
            }`}
            title="Text Tool (Click canvas to type)"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Pan Tool */}
          <button
            type="button"
            onClick={() => {
              setTool('pan');
              setSelectedStrokeId(null);
              setIsPenMenuOpen(false);
              setIsEraserMenuOpen(false);
              setIsShapeMenuOpen(false);
            }}
            className={`p-2 rounded-xl transition-all ${
              tool === 'pan'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
            }`}
            title="Pan / Hand Tool (Drag canvas view)"
          >
            <Hand className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-apple-border/80 dark:bg-white/15 mx-1 shrink-0" />

        {/* 2. Curated Quick Colors */}
        <div className="flex items-center gap-1.5">
          {[
            { hex: '#1C1C1E', name: 'Black' },
            { hex: '#007AFF', name: 'Blue' },
            { hex: '#34C759', name: 'Green' },
            { hex: '#FF9500', name: 'Orange' },
            { hex: '#FF3B30', name: 'Red' },
            { hex: '#AF52DE', name: 'Purple' }
          ].map((c) => {
            const isSelected = color.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(c.hex)}
                className={`w-5 h-5 rounded-full transition-all shrink-0 relative ${
                  isSelected ? 'ring-2 ring-apple-blue ring-offset-2 dark:ring-offset-[#1C1C1E] scale-110' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            );
          })}

          {/* Native Color Picker */}
          <label className="relative w-5 h-5 rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 to-blue-500 cursor-pointer flex items-center justify-center hover:scale-110 transition-transform shadow-xs shrink-0" title="Custom Color">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>

        <div className="h-6 w-px bg-apple-border/80 dark:bg-white/15 mx-1 shrink-0" />

        {/* 3. Quick Size Buttons */}
        <div className="flex items-center gap-1">
          {[
            { label: 'S', size: 2 },
            { label: 'M', size: 6 },
            { label: 'L', size: 14 }
          ].map((s) => {
            const currentSize = tool === 'highlighter' ? highlighterSize : isCurrentToolEraser ? eraserSize : size;
            const isSelected = Math.abs(currentSize - s.size) <= 2;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  if (tool === 'highlighter') setHighlighterSize(s.size * 3);
                  else if (isCurrentToolEraser) setEraserSize(s.size * 3);
                  else setSize(s.size);
                }}
                className={`px-2 py-1 rounded-lg text-caption font-bold transition-all ${
                  isSelected
                    ? 'bg-apple-blue text-white shadow-2xs'
                    : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                }`}
                title={`Stroke size: ${s.size}px`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="h-6 w-px bg-apple-border/80 dark:bg-white/15 mx-1 shrink-0" />

        {/* 4. Pen Studio Customizer Toggle */}
        <button
          type="button"
          onClick={() => setShowToolCustomizer(!showToolCustomizer)}
          className={`p-2 rounded-xl transition-all ${
            showToolCustomizer
              ? 'bg-apple-blue text-white shadow-xs'
              : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
          }`}
          title="Open Pen Studio & Advanced Sliders"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // 1. TRUE IMMERSIVE FULL-SCREEN VIEWPORT
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen bg-[#0E0E10] text-white flex flex-col p-3 gap-2 select-none overflow-hidden animate-fade-in">
        {/* Hidden Image Input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Top Fullscreen Header with Exit Button */}
        <div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-xl border border-white/15 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-apple-green animate-pulse" />
            <span className="font-bold text-footnote tracking-wide text-white">
              Collaborative Whiteboard
            </span>
            <span className="text-caption text-white/50 hidden sm:inline">
              (Press Esc to exit)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1 rounded-lg bg-apple-blue hover:bg-apple-blueHover text-white font-semibold text-caption flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Full Screen</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/15 text-white/70 hover:text-white transition-colors"
              title="Close Whiteboard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        {renderStudioToolbar()}

        {/* Canvas */}
        {renderCanvasViewport()}

        {/* Clear Canvas Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmClearOpen}
          onClose={() => setConfirmClearOpen(false)}
          onConfirm={() => {
            onClearWhiteboard();
            setLocalStrokes([]);
            setRedoStack([]);
            setSelectedStrokeId(null);
          }}
          title="Clear Whiteboard?"
          message="This will instantly erase all drawings and annotations for everyone in the room."
          confirmText="Clear All"
          cancelText="Cancel"
          variant="danger"
          iconType="delete"
        />
      </div>
    );
  }

  // 2. STANDARD FITTED MODAL VIEWPORT
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Collaborative Whiteboard"
      maxWidth="max-w-6xl"
    >
      <div className="select-none flex flex-col h-[76vh] max-h-[750px] space-y-2.5 overflow-hidden">
        {/* Hidden Image Input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Primary Studio Toolbar */}
        {renderStudioToolbar()}

        {/* The Collaborative Canvas Viewport */}
        {renderCanvasViewport()}

        {/* Clear Canvas Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmClearOpen}
          onClose={() => setConfirmClearOpen(false)}
          onConfirm={() => {
            onClearWhiteboard();
            setLocalStrokes([]);
            setRedoStack([]);
            setSelectedStrokeId(null);
          }}
          title="Clear Whiteboard?"
          message="This will instantly erase all drawings and annotations for everyone in the room."
          confirmText="Clear All"
          cancelText="Cancel"
          variant="danger"
          iconType="delete"
        />
      </div>
    </Modal>
  );
};
