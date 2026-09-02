import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal } from '../common/Modal.js';
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
  | 'note'
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

const NOTE_COLORS = [
  { id: 'yellow', name: 'Canary Yellow', bg: '#FEF08A', border: '#FACC15', text: '#713F12' },
  { id: 'green', name: 'Mint Green', bg: '#BBF7D0', border: '#4ADE80', text: '#14532D' },
  { id: 'blue', name: 'Sky Blue', bg: '#BAE6FD', border: '#38BDF8', text: '#0C4A6E' },
  { id: 'purple', name: 'Lavender', bg: '#E9D5FF', border: '#C084FC', text: '#581C87' },
  { id: 'pink', name: 'Coral Pink', bg: '#FECDD3', border: '#FB7185', text: '#881337' },
  { id: 'orange', name: 'Peach', bg: '#FED7AA', border: '#FB923C', text: '#7C2D12' }
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

  // Sticky Note Modal / Input State
  const [noteInputPos, setNoteInputPos] = useState<WhiteboardPoint | null>(null);
  const [noteTitle, setNoteTitle] = useState('Idea Note');
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0].bg);

  // Menu Dropdowns
  const [isPenMenuOpen, setIsPenMenuOpen] = useState(false);
  const [isEraserMenuOpen, setIsEraserMenuOpen] = useState(false);
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);
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

    // Handle Text Label Stroke
    if (stroke.type === 'text' && stroke.text) {
      const p = points[0];
      const fontSize = stroke.fontSize || 24;
      ctx.font = `${stroke.fontStyle === 'bold' ? 'bold' : '600'} ${fontSize}px -apple-system, system-ui, sans-serif`;
      ctx.fillStyle = stroke.color;
      ctx.globalAlpha = baseAlpha;
      ctx.fillText(stroke.text, p.x, p.y);
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
    // Handle Sticky Note Card
    if (stroke.type === 'note') {
      const p = points[0];
      const w = stroke.noteWidth || 220;
      const h = stroke.noteHeight || 180;
      const bgColor = stroke.noteColor || '#FEF08A';
      const title = stroke.noteTitle || 'Sticky Note';
      const text = stroke.noteText || '';

      // 1. Drop shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      // 2. Note card background
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, w, h, 12);
      ctx.fill();
      ctx.restore();

      // 3. Top header accent strip
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, w, 28, [12, 12, 0, 0]);
      ctx.fill();

      // 4. Dog-ear folded corner at bottom right
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.beginPath();
      ctx.moveTo(p.x + w - 16, p.y + h);
      ctx.lineTo(p.x + w, p.y + h - 16);
      ctx.lineTo(p.x + w - 16, p.y + h - 16);
      ctx.closePath();
      ctx.fill();

      // 5. Note Title
      ctx.font = 'bold 13px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#1C1C1E';
      ctx.fillText(title, p.x + 12, p.y + 19);

      // 6. Note Body Text with automatic word-wrap
      ctx.font = '500 12px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#2C2C2E';
      const maxTextW = w - 24;
      const words = text.split(/\s+/);
      let line = '';
      let lineY = p.y + 46;
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextW && line !== '') {
          ctx.fillText(line, p.x + 12, lineY);
          line = word;
          lineY += 16;
          if (lineY > p.y + h - 20) break;
        } else {
          line = testLine;
        }
      }
      if (line && lineY <= p.y + h - 20) {
        ctx.fillText(line, p.x + 12, lineY);
      }

      ctx.restore();
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
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
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
      ctx.lineWidth = stroke.size;
    } else if (stroke.type === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.65 * baseAlpha;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(1, stroke.size * 0.7);
    } else if (stroke.type === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.88 * baseAlpha;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * 1.5;
    } else if (stroke.type === 'fountain') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = baseAlpha;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
    } else if (stroke.type === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.6 * baseAlpha;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * 1.5;
      ctx.shadowColor = stroke.color;
      ctx.shadowBlur = 3;
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
    } else {
      // Dynamic Pen Bézier Spline with Pressure Curves
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        const pressure = ((p1.pressure ?? 0.5) + (p2.pressure ?? 0.5)) / 2;
        const pFactor = (pressureSensitivity / 100);

        if (stroke.type === 'eraser') {
          ctx.lineWidth = stroke.size * 2.5;
        } else if (stroke.type === 'ballpoint') {
          // Ballpoint: strictly uniform crisp line
          ctx.lineWidth = Math.max(1, stroke.size);
        } else if (stroke.type === 'fountain') {
          // Fountain Pen: calligraphic angle-sensitive nib with expressive stroke taper
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const angle = Math.atan2(dy, dx);
          const angleMod = 0.35 + 0.65 * Math.abs(Math.sin(angle - Math.PI / 4));
          ctx.lineWidth = Math.max(1, stroke.size * (0.25 + pressure * 1.6 * angleMod * pFactor));
        } else if (stroke.type === 'pencil') {
          // Pencil: softer, thinner graphite sketch line
          ctx.lineWidth = Math.max(1, stroke.size * (0.4 + pressure * 0.5 * pFactor));
        } else if (stroke.type === 'brush') {
          // Art Brush: dynamic wide responsive sweep
          ctx.lineWidth = Math.max(2, stroke.size * (0.2 + pressure * 2.2 * pFactor));
        } else if (stroke.type === 'marker') {
          // Marker: soft, wide, luminous
          ctx.lineWidth = Math.max(2, stroke.size * 1.5);
        } else {
          // Standard Ink Pen: natural smooth ink line
          ctx.lineWidth = Math.max(1, stroke.size * (0.5 + pressure * 0.8 * pFactor));
        }

        ctx.beginPath();
        if (i === 0) {
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(midX, midY);
        } else {
          const prevMidX = (points[i - 1].x + p1.x) / 2;
          const prevMidY = (points[i - 1].y + p1.y) / 2;
          ctx.moveTo(prevMidX, prevMidY);
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
        ctx.stroke();
      }
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

    // 1. TEXT TOOL: Spawn text note placement
    if (tool === 'text') {
      setTextInputPos(startPoint);
      setTextInputString('');
      return;
    }

    // 1.5 STICKY NOTE TOOL: Spawn sticky note placement
    if (tool === 'note') {
      setNoteInputPos(startPoint);
      setNoteTitle('Quick Note');
      setNoteText('');
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

  // Submit Sticky Note onto Canvas
  const handleCommitNote = () => {
    if (!noteInputPos || (!noteTitle.trim() && !noteText.trim())) {
      setNoteInputPos(null);
      return;
    }
    const noteStroke: WhiteboardStroke = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: 'note',
      color: '#1C1C1E',
      size: 1,
      opacity: 100,
      points: [noteInputPos],
      noteTitle: noteTitle.trim() || 'Sticky Note',
      noteText: noteText.trim(),
      noteColor: noteColor,
      noteWidth: 220,
      noteHeight: 180
    };

    setLocalStrokes((prev) => [...prev, noteStroke]);
    onEmitStroke(noteStroke);
    setSelectedStrokeId(noteStroke.id);
    setNoteInputPos(null);
    setNoteTitle('Quick Note');
    setNoteText('');
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
  const renderStudioToolbar = () => (
    <>
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 p-2 bg-apple-secondaryBg dark:bg-white/5 rounded-2xl border border-apple-border/70 dark:border-white/10 shadow-2xs">
        {/* Left: Tools Group (Select/Move, Pen, Highlighter, Erasers, Text, Hand) */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
          {/* 1. SELECT & MOVE TOOL */}
          <button
            type="button"
            onClick={() => {
              setTool('select');
              setIsPenMenuOpen(false);
              setIsEraserMenuOpen(false);
            }}
            className={`p-2 rounded-lg transition-all flex items-center gap-1 ${
              tool === 'select'
                ? 'bg-apple-blue text-white shadow-sm font-semibold'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Select & Move Shape (Click & drag any drawn shape/stroke)"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>

          {/* 2. PEN TOOLS DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={handleMainPenButtonClick}
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                isCurrentToolPen
                  ? 'bg-apple-blue text-white shadow-sm'
                  : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
              }`}
              title={`Current Pen: ${currentPenMeta.label} (Click to open studio customizer)`}
            >
              <ActivePenIcon className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>
          </div>

          {/* 3. HIGHLIGHTER */}
          <button
            type="button"
            onClick={() => {
              setTool('highlighter');
              setSelectedStrokeId(null);
            }}
            className={`p-2 rounded-lg transition-all ${
              tool === 'highlighter' ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Neon Highlighter (Clean Ribbon)"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          {/* 4. MULTI-ERASER SUITE DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={handleMainEraserButtonClick}
              className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                isCurrentToolEraser
                  ? 'bg-apple-blue text-white shadow-sm'
                  : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
              }`}
              title={`Current Eraser: ${currentEraserMeta.label} (Click to open menu)`}
            >
              <ActiveEraserIcon className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {/* Eraser Suite Dropdown Menu */}
            {isEraserMenuOpen && (
              <div className="absolute left-0 top-full mt-2 bg-white dark:bg-[#1C1C1E] border border-apple-border/80 dark:border-white/15 rounded-2xl shadow-2xl p-2 z-50 w-64 space-y-1 animate-scale-up">
                <div className="px-2 py-1 border-b border-apple-border/40 dark:border-white/10 flex items-center justify-between">
                  <span className="text-caption font-bold uppercase tracking-wider text-apple-textSecondary dark:text-white/50">
                    Eraser Suite
                  </span>
                  <span className="text-[10px] font-mono text-apple-blue font-semibold">
                    {eraserSize}px
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  {ERASER_TOOLS.map((e) => {
                    const Icon = e.icon;
                    const isSelected = activeEraserType === e.id && isCurrentToolEraser;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => handleSelectEraserSubtool(e.id)}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-apple-blue text-white font-semibold shadow-2xs'
                            : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-white/20' : 'bg-apple-secondaryBg dark:bg-white/5'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                          <div className="text-footnote font-semibold flex items-center gap-1.5">
                            <span>{e.label}</span>
                          </div>
                          <p className={`text-[11px] leading-tight line-clamp-1 ${isSelected ? 'text-white/80' : 'text-apple-textSecondary dark:text-white/50'}`}>
                            {e.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 5. TEXT / ANNOTATION TOOL */}
          <button
            type="button"
            onClick={() => {
              setTool('text');
              setSelectedStrokeId(null);
            }}
            className={`p-2 rounded-lg transition-all ${
              tool === 'text' ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Text Label (Click canvas to type)"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* 5.5 STICKY NOTE TOOL */}
          <button
            type="button"
            onClick={() => {
              setTool('note');
              setSelectedStrokeId(null);
              // Open note popover at center of view or ready to click
              setNoteInputPos({ x: (320 - pan.x) / zoom, y: (200 - pan.y) / zoom });
              setNoteTitle('Quick Note');
              setNoteText('');
            }}
            className={`p-2 rounded-lg transition-all ${
              tool === 'note' || noteInputPos !== null
                ? 'bg-amber-400 text-amber-950 font-bold shadow-sm'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Add Sticky Note (Yellow, Green, Blue, Purple, Pink)"
          >
            <StickyNote className="w-4 h-4" />
          </button>

          {/* 6. PAN / HAND TOOL */}
          <button
            type="button"
            onClick={() => {
              setTool('pan');
              setSelectedStrokeId(null);
            }}
            className={`p-2 rounded-lg transition-all ${
              tool === 'pan' ? 'bg-amber-500 text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Pan / Hand Tool (Drag canvas view)"
          >
            <Hand className="w-4 h-4" />
          </button>
        </div>

        {/* Shapes Menu Group */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsShapeMenuOpen(!isShapeMenuOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border/60 dark:border-white/10 shadow-sm text-footnote font-semibold transition-all ${
              ['rect', 'circle', 'triangle', 'diamond', 'star', 'arrow', 'line'].includes(tool)
                ? 'text-apple-blue border-apple-blue dark:border-apple-blue'
                : 'text-apple-textPrimary dark:text-white'
            }`}
          >
            <Square className="w-4 h-4" />
            <span>Shapes</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isShapeMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 bg-white dark:bg-[#1C1C1E] border border-apple-border/70 dark:border-white/10 rounded-2xl shadow-xl p-2 z-40 w-44 grid grid-cols-2 gap-1 animate-scale-up">
              <button
                onClick={() => {
                  setTool('rect');
                  setIsShapeMenuOpen(false);
                  setSelectedStrokeId(null);
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-caption font-semibold ${
                  tool === 'rect' ? 'bg-apple-blue text-white' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>Rectangle</span>
              </button>
              <button
                onClick={() => {
                  setTool('circle');
                  setIsShapeMenuOpen(false);
                  setSelectedStrokeId(null);
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-caption font-semibold ${
                  tool === 'circle' ? 'bg-apple-blue text-white' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                }`}
              >
                <Circle className="w-3.5 h-3.5" />
                <span>Circle</span>
              </button>
              <button
                onClick={() => {
                  setTool('triangle');
                  setIsShapeMenuOpen(false);
                  setSelectedStrokeId(null);
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-caption font-semibold ${
                  tool === 'triangle' ? 'bg-apple-blue text-white' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                }`}
              >
                <Triangle className="w-3.5 h-3.5" />
                <span>Triangle</span>
              </button>
              <button
                onClick={() => {
                  setTool('diamond');
                  setIsShapeMenuOpen(false);
                  setSelectedStrokeId(null);
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-caption font-semibold ${
                  tool === 'diamond' ? 'bg-apple-blue text-white' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Diamond</span>
              </button>
              <button
                onClick={() => {
                  setTool('arrow');
                  setIsShapeMenuOpen(false);
                  setSelectedStrokeId(null);
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-caption font-semibold ${
                  tool === 'arrow' ? 'bg-apple-blue text-white' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Arrow</span>
              </button>
              <button
                onClick={() => {
                  setTool('line');
                  setIsShapeMenuOpen(false);
                  setSelectedStrokeId(null);
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-caption font-semibold ${
                  tool === 'line' ? 'bg-apple-blue text-white' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Line</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Size Presets & Customizer Toggle */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
          {(tool === 'highlighter' ? HIGHLIGHTER_PRESETS : isCurrentToolEraser ? ERASER_PRESETS : PEN_PRESETS).map((pSize) => {
            const isActive = (tool === 'highlighter' ? highlighterSize : isCurrentToolEraser ? eraserSize : size) === pSize;
            return (
              <button
                key={pSize}
                type="button"
                onClick={() => {
                  if (tool === 'highlighter') {
                    setHighlighterSize(pSize);
                  } else if (isCurrentToolEraser) {
                    setEraserSize(pSize);
                  } else {
                    setSize(pSize);
                  }
                }}
                className={`px-2 py-1 rounded-lg text-caption font-semibold transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-apple-secondaryBg dark:bg-white/20 text-apple-blue dark:text-white font-bold'
                    : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
                }`}
                title={`Stroke size ${pSize}px`}
              >
                <span>{pSize}px</span>
              </button>
            );
          })}

          {/* Tool Customizer Toggle */}
          <button
            type="button"
            onClick={() => setShowToolCustomizer(!showToolCustomizer)}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              showToolCustomizer
                ? 'bg-apple-blue text-white font-semibold'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Open Pen Studio Customizer"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Theme Mode: Light / Dark */}
        <div className="flex items-center gap-0.5 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
          <button
            type="button"
            onClick={() => setCanvasTheme('light')}
            className={`p-1.5 rounded-lg text-caption font-medium transition-all ${
              canvasTheme === 'light'
                ? 'bg-apple-blue text-white shadow-2xs'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Light Theme Whiteboard"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCanvasTheme('dark')}
            className={`p-1.5 rounded-lg text-caption font-medium transition-all ${
              canvasTheme === 'dark'
                ? 'bg-apple-blue text-white shadow-2xs'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Dark Theme Whiteboard"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Pattern Overlay: Blank / Grid / Dots / Lines */}
        <div className="flex items-center gap-0.5 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
          <button
            type="button"
            onClick={() => setCanvasPattern('plain')}
            className={`px-2 py-1 rounded-lg text-caption font-semibold transition-all ${
              canvasPattern === 'plain'
                ? 'bg-apple-blue text-white shadow-2xs font-bold'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Plain Blank Canvas"
          >
            <span className="text-[11px]">Blank</span>
          </button>
          <button
            type="button"
            onClick={() => setCanvasPattern('grid')}
            className={`p-1.5 rounded-lg text-caption font-medium transition-all ${
              canvasPattern === 'grid'
                ? 'bg-apple-blue text-white shadow-2xs'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Math Grid (Selectable in Light & Dark Mode)"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCanvasPattern('dots')}
            className={`px-2 py-1 rounded-lg text-caption font-bold transition-all ${
              canvasPattern === 'dots'
                ? 'bg-apple-blue text-white shadow-2xs'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Dot Graph Paper (Selectable in Light & Dark Mode)"
          >
            <span className="text-[10.5px]">DOTS</span>
          </button>
          <button
            type="button"
            onClick={() => setCanvasPattern('lines')}
            className={`p-1.5 rounded-lg text-caption font-medium transition-all ${
              canvasPattern === 'lines'
                ? 'bg-apple-blue text-white shadow-2xs'
                : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Ruled Notebook Lines (Selectable in Light & Dark Mode)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Undo / Redo / Ruler Controls */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
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
          <button
            type="button"
            onClick={() => setShowRuler(!showRuler)}
            className={`p-1.5 rounded-lg transition-colors ${
              showRuler ? 'bg-apple-blue text-white' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
            }`}
            title="Toggle Measurement Ruler"
          >
            <Ruler className="w-4 h-4" />
          </button>
        </div>

        {/* Actions: Insert Image, Zoom, Export, Fullscreen, Clear */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white transition-colors border border-apple-border/60 dark:border-white/10 shadow-sm"
            title="Insert Image / Diagram onto Canvas"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Pan & Zoom Navigation Controls */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="px-2 py-0.5 rounded-lg text-caption font-mono font-semibold text-apple-textSecondary hover:text-apple-blue"
              title="Reset View (100%)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportPNG}
            className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white transition-colors border border-apple-border/60 dark:border-white/10 shadow-sm"
            title="Save as High-Res PNG"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleBroadcastSnapshot}
            className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-blue transition-colors border border-apple-border/60 dark:border-white/10 shadow-sm"
            title="Broadcast Snapshot to Room Files"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2 rounded-xl transition-colors border shadow-sm ${
              isFullscreen
                ? 'bg-apple-blue text-white border-apple-blue'
                : 'bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white border-apple-border/60 dark:border-white/10'
            }`}
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen Canvas'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all drawings on the whiteboard?')) {
                onClearWhiteboard();
                setLocalStrokes([]);
                setRedoStack([]);
                setSelectedStrokeId(null);
              }
            }}
            className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-red-50 dark:hover:bg-red-950 text-apple-red transition-colors border border-apple-border/60 dark:border-white/10 shadow-sm"
            title="Clear Canvas"
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

      {/* Floating Inline Text Input Popover */}
      {textInputPos && (
        <div
          style={{
            position: 'absolute',
            left: `${textInputPos.x * zoom + pan.x}px`,
            top: `${textInputPos.y * zoom + pan.y}px`,
            transform: 'translate(0, -100%)'
          }}
          className="z-50 p-2.5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-apple-border shadow-2xl space-y-2 animate-scale-up"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={textInputString}
              onChange={(e) => setTextInputString(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitText();
                if (e.key === 'Escape') setTextInputPos(null);
              }}
              placeholder="Type note or equation..."
              className="px-3 py-1.5 bg-apple-secondaryBg dark:bg-white/10 rounded-xl text-footnote font-semibold text-apple-textPrimary dark:text-white outline-none focus:ring-2 focus:ring-apple-blue"
            />
            <button
              type="button"
              onClick={handleCommitText}
              className="p-2 rounded-xl bg-apple-blue text-white shadow-sm"
              title="Add text to whiteboard"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTextInputPos(null)}
              className="p-2 rounded-xl hover:bg-apple-secondaryBg text-apple-textSecondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-caption">
            <span className="text-apple-textSecondary">Size:</span>
            <input
              type="range"
              min="14"
              max="64"
              value={textFontSize}
              onChange={(e) => setTextFontSize(parseInt(e.target.value, 10))}
              className="w-24 accent-apple-blue"
            />
            <span className="font-mono text-apple-textPrimary dark:text-white">{textFontSize}px</span>
            <button
              type="button"
              onClick={() => setIsTextBold(!isTextBold)}
              className={`px-2 py-0.5 rounded font-bold ${isTextBold ? 'bg-apple-blue text-white' : 'bg-apple-secondaryBg text-apple-textSecondary'}`}
            >
              B
            </button>
          </div>
        </div>
      )}

      {/* Floating Sticky Note Creator Popover */}
      {noteInputPos && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.max(10, Math.min(noteInputPos.x * zoom + pan.x, (containerRef.current?.clientWidth || 600) - 300))}px`,
            top: `${Math.max(10, Math.min(noteInputPos.y * zoom + pan.y, (containerRef.current?.clientHeight || 400) - 250))}px`,
            transform: 'translate(0, 0)'
          }}
          className="z-50 p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-apple-border shadow-2xl space-y-3 animate-scale-up w-72"
        >
          <div className="flex items-center justify-between pb-1 border-b border-apple-border/40 dark:border-white/10">
            <span className="font-bold text-footnote text-apple-textPrimary dark:text-white flex items-center gap-1.5">
              <StickyNote className="w-4 h-4 text-amber-500" />
              <span>Add Sticky Note</span>
            </span>
            <button
              type="button"
              onClick={() => setNoteInputPos(null)}
              className="p-1 rounded-lg hover:bg-apple-secondaryBg text-apple-textSecondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Note Color Swatches */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-apple-textSecondary">Color:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {NOTE_COLORS.map((nc) => (
                <button
                  key={nc.id}
                  type="button"
                  onClick={() => setNoteColor(nc.bg)}
                  className={`w-6 h-6 rounded-full transition-all shrink-0 border ${
                    noteColor === nc.bg ? 'ring-2 ring-apple-blue ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: nc.bg, borderColor: nc.border }}
                  title={nc.name}
                />
              ))}
            </div>
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note Title (optional)"
            className="w-full px-3 py-1.5 bg-apple-secondaryBg dark:bg-white/10 rounded-xl text-caption font-bold text-apple-textPrimary dark:text-white outline-none focus:ring-2 focus:ring-apple-blue"
          />

          {/* Body Textarea */}
          <textarea
            autoFocus
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write your note, idea or task..."
            className="w-full px-3 py-2 bg-apple-secondaryBg dark:bg-white/10 rounded-xl text-caption font-medium text-apple-textPrimary dark:text-white outline-none focus:ring-2 focus:ring-apple-blue resize-none"
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setNoteInputPos(null)}
              className="px-3 py-1.5 rounded-xl text-caption font-semibold text-apple-textSecondary hover:bg-apple-secondaryBg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCommitNote}
              className="px-3.5 py-1.5 rounded-xl bg-apple-blue hover:bg-apple-blueHover text-white font-bold text-caption shadow-sm transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Place Note</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Multi-Pen Box Dock (Bottom Center / Side Tray) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 bg-black/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl select-none">
        {/* Toggle Dock Button */}
        <button
          type="button"
          onClick={() => setShowToolCustomizer(!showToolCustomizer)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Open Pen Studio"
        >
          <Sliders className="w-4 h-4 text-apple-blue" />
        </button>

        <div className="h-6 w-px bg-white/20 mx-0.5" />

        {/* 6 Quick Switch Pen Slots */}
        {penBoxSlots.map((slot) => {
          const isSlotActive = activePenBoxId === slot.id && isCurrentToolPen;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => handleSelectPenBoxSlot(slot)}
              className={`relative px-2.5 py-1.5 rounded-xl transition-all flex flex-col items-center gap-0.5 ${
                isSlotActive
                  ? 'bg-white/25 scale-110 shadow-lg ring-1 ring-white/50'
                  : 'hover:bg-white/10 opacity-75 hover:opacity-100'
              }`}
              title={`${slot.type} (${slot.size}px)`}
            >
              {/* Miniature 3D Nib Indicator */}
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: slot.color }}
              />
              <span className="text-[9px] font-mono font-bold text-white leading-none">
                {slot.label}
              </span>
            </button>
          );
        })}

        <div className="h-6 w-px bg-white/20 mx-0.5" />

        {/* 1-Tap Eraser Quick Toggle */}
        <button
          type="button"
          onClick={handleMainEraserButtonClick}
          className={`p-2 rounded-xl transition-colors ${
            isCurrentToolEraser ? 'bg-apple-blue text-white' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title="Switch to Eraser"
        >
          <Eraser className="w-4 h-4" />
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
      </div>
    </Modal>
  );
};
