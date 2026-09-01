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
  Sliders
} from 'lucide-react';

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  strokes: WhiteboardStroke[];
  onEmitStroke: (stroke: WhiteboardStroke) => void;
  onClearWhiteboard: () => void;
  onBroadcastImage: (file: File) => Promise<any>;
}

type ToolType =
  | 'pen'
  | 'pencil'
  | 'brush'
  | 'highlighter'
  | 'eraser'
  | 'object_eraser'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'arrow'
  | 'line'
  | 'star'
  | 'pan';

type CanvasBgType = 'light' | 'dark' | 'grid' | 'dots' | 'lines';

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

const PEN_PRESETS = [2, 4, 8, 16, 24];
const HIGHLIGHTER_PRESETS = [12, 20, 32, 48, 64];

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({
  isOpen,
  onClose,
  strokes,
  onEmitStroke,
  onClearWhiteboard,
  onBroadcastImage
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Tools & Styling
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#007AFF');
  const [size, setSize] = useState(4);
  const [highlighterSize, setHighlighterSize] = useState(24);
  const [customColor, setCustomColor] = useState('#007AFF');
  const [canvasBg, setCanvasBg] = useState<CanvasBgType>('light');
  const [showRuler, setShowRuler] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);
  const [isPenMenuOpen, setIsPenMenuOpen] = useState(false);
  const [showSizeSlider, setShowSizeSlider] = useState(false);

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

  // Cache loaded images
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Current active stroke size based on tool
  const currentActiveSize = tool === 'highlighter' ? highlighterSize : size;

  const handleToolSelect = (newTool: ToolType) => {
    setTool(newTool);
    if (newTool === 'highlighter' && size < 12) {
      // Auto adjust to highlighter default width
    }
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

  // Redraw canvas with full transform, grids, background & strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render background
    const isDark = canvasBg === 'dark';
    ctx.fillStyle = isDark ? '#121212' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply 2D Pan and Zoom
    ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);

    const startX = -pan.x / zoom - 200;
    const endX = (canvas.width - pan.x) / zoom + 200;
    const startY = -pan.y / zoom - 200;
    const endY = (canvas.height - pan.y) / zoom + 200;

    // Background Patterns
    if (canvasBg === 'grid') {
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 122, 255, 0.08)';
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
    } else if (canvasBg === 'dots') {
      ctx.save();
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
      const dotSize = 30;
      for (let x = startX - (startX % dotSize); x <= endX; x += dotSize) {
        for (let y = startY - (startY % dotSize); y <= endY; y += dotSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (canvasBg === 'lines') {
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 122, 255, 0.12)';
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

    // Optional Ruler & Coordinate Scale Overlay
    if (showRuler) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Screen-space ruler
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
  }, [localStrokes, zoom, pan, canvasBg, showRuler]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(redrawCanvas, 50);
    }
  }, [isOpen, redrawCanvas]);

  // Comprehensive Stroke & Shape Renderer
  const drawSmoothStroke = (ctx: CanvasRenderingContext2D, stroke: WhiteboardStroke, isDarkBg: boolean) => {
    const points = stroke.points;
    if (!points || points.length === 0) return;

    ctx.save();

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
      ctx.globalAlpha = 0.35;
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
        ctx.stroke(); // STROKE ONCE for uniform alpha without overlap dots
      }

      ctx.restore();
      return;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.type === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = isDarkBg ? '#121212' : '#FFFFFF';
      ctx.lineWidth = stroke.size * 3;
    } else if (stroke.type === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Math.max(1, stroke.size * 0.7);
    } else if (stroke.type === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * 1.8;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
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
      // True continuous Bézier spline connecting midpoints
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        const pressure = ((p1.pressure ?? 0.5) + (p2.pressure ?? 0.5)) / 2;
        ctx.lineWidth =
          stroke.type === 'eraser'
            ? stroke.size * 3
            : stroke.type === 'pencil'
            ? Math.max(1, stroke.size * 0.7)
            : stroke.type === 'brush'
            ? Math.max(2, stroke.size * (0.8 + pressure * 1.6))
            : Math.max(1, stroke.size * (0.35 + pressure * 0.9));

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

  // Convert Pointer Screen coordinates to Virtual World coordinates
  const getCanvasWorldCoords = (e: React.PointerEvent<HTMLCanvasElement>): WhiteboardPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const rawX = clientX * scaleX;
    const rawY = clientY * scaleY;

    const worldX = (rawX - pan.x) / zoom;
    const worldY = (rawY - pan.y) / zoom;

    let pressure = e.pressure;
    if (e.pointerType === 'mouse' && pressure === 0) {
      pressure = 0.5;
    }

    return {
      x: worldX,
      y: worldY,
      pressure
    };
  };

  // Undo and Redo operations
  const handleUndo = useCallback(() => {
    if (localStrokes.length === 0) return;
    const last = localStrokes[localStrokes.length - 1];
    const newStrokes = localStrokes.slice(0, -1);
    setRedoStack((prev) => [...prev, last]);
    setLocalStrokes(newStrokes);
  }, [localStrokes]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setLocalStrokes((prev) => [...prev, last]);
    onEmitStroke(last);
  }, [redoStack, onEmitStroke]);

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleUndo, handleRedo]);

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

    const startPoint = getCanvasWorldCoords(e);

    // Object Eraser: Delete stroke on click
    if (tool === 'object_eraser') {
      const targetIndex = localStrokes.findIndex((s) => {
        return s.points.some((p) => Math.hypot(p.x - startPoint.x, p.y - startPoint.y) < 25);
      });
      if (targetIndex !== -1) {
        const removed = localStrokes[targetIndex];
        setRedoStack((prev) => [...prev, removed]);
        setLocalStrokes((prev) => prev.filter((_, idx) => idx !== targetIndex));
      }
      return;
    }

    const strokeType = tool;
    const strokeSize = strokeType === 'highlighter' ? highlighterSize : size;

    setIsDrawing(true);
    currentPointsRef.current = [startPoint];

    // Live preview
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const activeStroke: WhiteboardStroke = {
        id: `temp-${Date.now()}`,
        type: strokeType,
        color,
        size: strokeSize,
        points: [startPoint]
      };
      ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
      drawSmoothStroke(ctx, activeStroke, canvasBg === 'dark');
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    if (!isDrawing) return;
    const pt = getCanvasWorldCoords(e);
    currentPointsRef.current.push(pt);

    const isShape = ['rect', 'circle', 'triangle', 'diamond', 'star', 'arrow', 'line'].includes(tool);
    const strokeType = (tool === 'object_eraser' || tool === 'pan') ? 'pen' : tool;
    const strokeSize = strokeType === 'highlighter' ? highlighterSize : size;

    if (isShape) {
      redrawCanvas();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const shapeStroke: WhiteboardStroke = {
          id: `preview-${Date.now()}`,
          type: strokeType,
          color,
          size: strokeSize,
          points: [currentPointsRef.current[0], pt]
        };
        ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
        drawSmoothStroke(ctx, shapeStroke, canvasBg === 'dark');
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
          points: currentPointsRef.current
        };
        ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
        drawSmoothStroke(ctx, activeStroke, canvasBg === 'dark');
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

    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPointsRef.current.length > 0) {
      const strokeType = (tool === 'object_eraser' || tool === 'pan') ? 'pen' : tool;
      const strokeSize = strokeType === 'highlighter' ? highlighterSize : size;
      const finalStroke: WhiteboardStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type: strokeType,
        color,
        size: strokeSize,
        points: [...currentPointsRef.current]
      };

      setLocalStrokes((prev) => [...prev, finalStroke]);
      setRedoStack([]);
      onEmitStroke(finalStroke);
    }

    currentPointsRef.current = [];
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

    tempCtx.fillStyle = canvasBg === 'dark' ? '#121212' : '#FFFFFF';
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Collaborative Whiteboard Studio"
      maxWidth={isFullscreen ? 'max-w-full !m-0 !h-screen !rounded-none' : 'max-w-6xl'}
    >
      <div className="space-y-3 select-none flex flex-col h-full">
        {/* Hidden Image Input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Primary Studio Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-apple-secondaryBg dark:bg-white/5 rounded-2xl border border-apple-border/70 dark:border-white/10 shadow-2xs">
          {/* Left: Pen Tools Group */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
            {/* Pen Options Dropdown / Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  handleToolSelect('pen');
                  setIsPenMenuOpen(!isPenMenuOpen);
                }}
                className={`p-2 rounded-lg transition-all flex items-center gap-1 ${
                  tool === 'pen' || tool === 'pencil' || tool === 'brush'
                    ? 'bg-apple-blue text-white shadow-sm'
                    : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
                }`}
                title="Pen & Brush Tools"
              >
                <Pen className="w-4 h-4" />
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {isPenMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 bg-white dark:bg-[#1C1C1E] border border-apple-border/70 dark:border-white/10 rounded-xl shadow-lg p-1.5 z-40 w-36 space-y-1 animate-scale-up">
                  <button
                    onClick={() => {
                      handleToolSelect('pen');
                      setIsPenMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-footnote ${
                      tool === 'pen' ? 'bg-apple-blue text-white font-semibold' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                    }`}
                  >
                    <Pen className="w-3.5 h-3.5" />
                    <span>Ink Pen</span>
                  </button>
                  <button
                    onClick={() => {
                      handleToolSelect('pencil');
                      setIsPenMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-footnote ${
                      tool === 'pencil' ? 'bg-apple-blue text-white font-semibold' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                    }`}
                  >
                    <Pen className="w-3.5 h-3.5 opacity-60" />
                    <span>Sketch Pencil</span>
                  </button>
                  <button
                    onClick={() => {
                      handleToolSelect('brush');
                      setIsPenMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-footnote ${
                      tool === 'brush' ? 'bg-apple-blue text-white font-semibold' : 'text-apple-textPrimary dark:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Art Brush</span>
                  </button>
                </div>
              )}
            </div>

            {/* Highlighter */}
            <button
              type="button"
              onClick={() => handleToolSelect('highlighter')}
              className={`p-2 rounded-lg transition-all ${
                tool === 'highlighter' ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
              }`}
              title="Highlighter"
            >
              <Highlighter className="w-4 h-4" />
            </button>

            {/* Eraser Tools */}
            <button
              type="button"
              onClick={() => handleToolSelect(tool === 'eraser' ? 'object_eraser' : 'eraser')}
              className={`p-2 rounded-lg transition-all ${
                tool === 'eraser' || tool === 'object_eraser'
                  ? 'bg-apple-blue text-white shadow-sm'
                  : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
              }`}
              title={tool === 'object_eraser' ? 'Object Eraser (Click to delete stroke)' : 'Brush Eraser (Click again for Object Eraser)'}
            >
              <Eraser className="w-4 h-4" />
            </button>

            {/* Pan / Move Canvas */}
            <button
              type="button"
              onClick={() => handleToolSelect('pan')}
              className={`p-2 rounded-lg transition-all ${
                tool === 'pan' ? 'bg-amber-500 text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
              }`}
              title="Pan / Hand Tool (Drag canvas)"
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
                    handleToolSelect('rect');
                    setIsShapeMenuOpen(false);
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
                    handleToolSelect('circle');
                    setIsShapeMenuOpen(false);
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
                    handleToolSelect('triangle');
                    setIsShapeMenuOpen(false);
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
                    handleToolSelect('diamond');
                    setIsShapeMenuOpen(false);
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
                    handleToolSelect('arrow');
                    setIsShapeMenuOpen(false);
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
                    handleToolSelect('line');
                    setIsShapeMenuOpen(false);
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

          {/* StarNote-style Quick Size Presets & Slider Toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
            {(tool === 'highlighter' ? HIGHLIGHTER_PRESETS : PEN_PRESETS).map((pSize) => {
              const isActive = (tool === 'highlighter' ? highlighterSize : size) === pSize;
              return (
                <button
                  key={pSize}
                  type="button"
                  onClick={() => {
                    if (tool === 'highlighter') {
                      setHighlighterSize(pSize);
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

            {/* Slider Toggle Button */}
            <button
              type="button"
              onClick={() => setShowSizeSlider(!showSizeSlider)}
              className={`p-1.5 rounded-lg transition-colors ${
                showSizeSlider ? 'bg-apple-blue text-white' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
              }`}
              title="Custom Thickness Slider"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Canvas Background Paper Themes */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
            <button
              type="button"
              onClick={() => setCanvasBg('light')}
              className={`p-1.5 rounded-lg text-caption font-medium transition-all ${
                canvasBg === 'light' ? 'bg-apple-blue text-white' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
              }`}
              title="Plain White Paper"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCanvasBg('dark')}
              className={`p-1.5 rounded-lg text-caption font-medium transition-all ${
                canvasBg === 'dark' ? 'bg-apple-blue text-white' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
              }`}
              title="Dark Obsidian Paper"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCanvasBg('grid')}
              className={`p-1.5 rounded-lg text-caption font-medium transition-all ${
                canvasBg === 'grid' ? 'bg-apple-blue text-white' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
              }`}
              title="Math Grid Paper"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCanvasBg('dots')}
              className={`p-1.5 rounded-lg text-caption font-medium transition-all ${
                canvasBg === 'dots' ? 'bg-apple-blue text-white' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
              }`}
              title="Dot Graph Paper"
            >
              <span className="text-[10px] font-bold px-1">DOTS</span>
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
              className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white transition-colors border border-apple-border/60 dark:border-white/10 shadow-sm"
              title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Canvas'}
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
                }
              }}
              className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-red-50 dark:hover:bg-red-950 text-apple-red transition-colors border border-apple-border/60 dark:border-white/10 shadow-sm"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* StarNote-style Thickness Customizer Drawer (Visible when toggled or adjusting) */}
        {showSizeSlider && (
          <div className="p-3 bg-white dark:bg-[#1C1C1E] rounded-xl border border-apple-border/70 dark:border-white/10 shadow-sm flex items-center justify-between gap-4 animate-scale-up">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-caption font-semibold text-apple-textSecondary dark:text-white/70 w-24">
                {tool === 'highlighter' ? 'Highlighter' : 'Stroke'} Width:
              </span>
              <input
                type="range"
                min="1"
                max={tool === 'highlighter' ? '64' : '36'}
                value={tool === 'highlighter' ? highlighterSize : size}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (tool === 'highlighter') {
                    setHighlighterSize(val);
                  } else {
                    setSize(val);
                  }
                }}
                className="flex-1 accent-apple-blue cursor-pointer"
              />
              <span className="text-footnote font-mono font-bold text-apple-textPrimary dark:text-white w-12 text-right">
                {tool === 'highlighter' ? highlighterSize : size}px
              </span>
            </div>

            {/* Live Nib Indicator */}
            <div className="flex items-center gap-2 pl-4 border-l border-apple-border/50 dark:border-white/10 shrink-0">
              <span className="text-caption text-apple-textSecondary">Nib Preview:</span>
              <div
                className="rounded-full shadow-inner border border-black/10 dark:border-white/20 transition-all"
                style={{
                  width: `${Math.min(32, Math.max(4, currentActiveSize))}px`,
                  height: `${Math.min(32, Math.max(4, currentActiveSize))}px`,
                  backgroundColor: color,
                  opacity: tool === 'highlighter' ? 0.45 : 1
                }}
              />
            </div>
          </div>
        )}

        {/* Color Palette Swatches (Self-contained, non-clipping Apple styling) */}
        {tool !== 'eraser' && tool !== 'object_eraser' && tool !== 'pan' && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-[#1C1C1E] rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {APPLE_PALETTE.map((c) => {
                const isSelected = color.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`w-7 h-7 rounded-full transition-all shrink-0 flex items-center justify-center ${
                      isSelected ? 'bg-apple-blue/15 dark:bg-white/15 p-0.5' : 'p-0.5 hover:scale-105'
                    }`}
                    title={c.name}
                  >
                    <span
                      className={`w-full h-full rounded-full flex items-center justify-center shadow-2xs border ${
                        isSelected ? 'border-apple-blue dark:border-white' : 'border-black/10 dark:border-white/20'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.hex === '#1C1C1E' || c.hex === '#5856D6' || c.hex === '#007AFF' || c.hex === '#FF3B30'
                              ? 'bg-white'
                              : 'bg-black'
                          }`}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Picker Swatch */}
            <div className="flex items-center gap-1.5 shrink-0 pl-2.5 border-l border-apple-border/50 dark:border-white/10">
              <label className="flex items-center gap-1.5 text-caption font-semibold text-apple-textSecondary dark:text-white/70 hover:text-apple-blue dark:hover:text-apple-blue cursor-pointer">
                <Palette className="w-3.5 h-3.5 text-apple-blue" />
                <span>Custom</span>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setColor(e.target.value);
                  }}
                  className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                />
              </label>
            </div>
          </div>
        )}

        {/* The Collaborative Canvas Viewport */}
        <div
          ref={containerRef}
          className={`relative flex-1 w-full bg-white dark:bg-black rounded-2xl overflow-hidden border border-apple-border/80 dark:border-white/10 shadow-inner flex items-center justify-center ${
            isFullscreen ? 'h-[80vh]' : 'h-[58vh] min-h-[420px]'
          }`}
        >
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`w-full h-full object-contain touch-none ${
              tool === 'pan' || isPanning
                ? 'cursor-grab active:cursor-grabbing'
                : tool === 'eraser' || tool === 'object_eraser'
                ? 'cursor-cell'
                : 'cursor-crosshair'
            }`}
          />
        </div>
      </div>
    </Modal>
  );
};
