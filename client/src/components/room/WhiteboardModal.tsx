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
  Undo,
  Palette,
  Sun,
  Moon,
  Grid
} from 'lucide-react';

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  strokes: WhiteboardStroke[];
  onEmitStroke: (stroke: WhiteboardStroke) => void;
  onClearWhiteboard: () => void;
  onBroadcastImage: (file: File) => Promise<any>;
}

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

const STROKE_WIDTHS = [
  { label: 'Fine', size: 2 },
  { label: 'Standard', size: 4 },
  { label: 'Medium', size: 8 },
  { label: 'Bold', size: 16 },
  { label: 'Thick', size: 28 }
];

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

  // Tools & Styling
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'line' | 'pan'>('pen');
  const [color, setColor] = useState('#007AFF');
  const [size, setSize] = useState(4);
  const [customColor, setCustomColor] = useState('#007AFF');
  const [canvasBg, setCanvasBg] = useState<'light' | 'dark' | 'grid'>('light');

  // Pan & Zoom Navigation
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPointsRef = useRef<WhiteboardPoint[]>([]);

  // Redraw canvas with full Pan/Zoom transform and Bézier smoothing
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render background
    ctx.fillStyle = canvasBg === 'dark' ? '#121212' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply 2D Pan and Zoom
    ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);

    // Optional Grid pattern
    if (canvasBg === 'grid') {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 122, 255, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      const startX = -pan.x / zoom - 200;
      const endX = (canvas.width - pan.x) / zoom + 200;
      const startY = -pan.y / zoom - 200;
      const endY = (canvas.height - pan.y) / zoom + 200;

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
    }

    // Render all saved strokes
    for (const stroke of strokes) {
      drawSmoothStroke(ctx, stroke);
    }
  }, [strokes, zoom, pan, canvasBg]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(redrawCanvas, 50);
    }
  }, [isOpen, redrawCanvas]);

  // Quadratic Bézier curve & pressure-sensitive renderer
  const drawSmoothStroke = (ctx: CanvasRenderingContext2D, stroke: WhiteboardStroke) => {
    const points = stroke.points;
    if (!points || points.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.type === 'eraser') {
      // Clean eraser matching background
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = canvasBg === 'dark' ? '#121212' : '#FFFFFF';
      ctx.lineWidth = stroke.size * 3;
    } else if (stroke.type === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * 3.5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
    }

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
    } else if (stroke.type === 'line' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (points.length === 1) {
      const p = points[0];
      const pressure = p.pressure ?? 0.5;
      const r = (stroke.size * (0.4 + pressure * 0.8)) / 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, r), 0, 2 * Math.PI);
      ctx.fillStyle = stroke.type === 'eraser' 
        ? (canvasBg === 'dark' ? '#121212' : '#FFFFFF') 
        : stroke.color;
      ctx.fill();
    } else {
      // True continuous Bézier spline connecting midpoints
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        const pressure = ((p1.pressure ?? 0.5) + (p2.pressure ?? 0.5)) / 2;
        ctx.lineWidth = stroke.type === 'eraser'
          ? stroke.size * 3
          : (stroke.type === 'highlighter' 
              ? stroke.size * 3.5 
              : Math.max(1, stroke.size * (0.35 + pressure * 0.9)));

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
      pressure: Math.max(0.1, pressure || 0.5)
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    if (tool === 'pan' || e.button === 1 || e.buttons === 4) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    setIsDrawing(true);
    const point = getCanvasWorldCoords(e);
    currentPointsRef.current = [point];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    if (!isDrawing) return;
    e.preventDefault();

    const point = getCanvasWorldCoords(e);
    currentPointsRef.current.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pan') return;

    // Full double-buffered redraw of active stroke — eliminates all spikes and rendering artifacts!
    redrawCanvas();
    ctx.save();
    ctx.setTransform(zoom, 0, 0, zoom, pan.x, pan.y);
    const strokeType = tool as 'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'line';
    drawSmoothStroke(ctx, {
      id: 'active',
      type: strokeType,
      color,
      size,
      points: currentPointsRef.current
    });
    ctx.restore();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPointsRef.current.length > 0) {
      const strokeType = (tool === 'pan' ? 'pen' : tool) as 'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'line';
      const newStroke: WhiteboardStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: strokeType,
        color,
        size,
        points: [...currentPointsRef.current]
      };
      onEmitStroke(newStroke);
      currentPointsRef.current = [];
    }
  };

  // Zoom helpers
  const handleZoomIn = () => setZoom(prev => Math.min(3.0, Math.round((prev + 0.25) * 100) / 100));
  const handleZoomOut = () => setZoom(prev => Math.max(0.4, Math.round((prev - 0.25) * 100) / 100));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.min(3.0, Math.max(0.4, Math.round((prev + delta) * 100) / 100)));
    } else {
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboard-${Date.now()}.png`;
    a.click();
  };

  const handleBroadcastSnapshot = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `whiteboard-${Date.now()}.png`, { type: 'image/png' });
        await onBroadcastImage(file);
      }
    }, 'image/png');
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Collaborative Freeform Whiteboard" maxWidth="max-w-5xl">
      <div className="space-y-3 select-none">
        {/* Apple Ribbon Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-apple-secondaryBg dark:bg-white/5 rounded-ios-card border border-apple-border/70 dark:border-white/10">
          {/* Drawing & Navigation Tools */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
            <button
              type="button"
              onClick={() => setTool('pen')}
              className={`p-2 rounded-lg transition-all ${tool === 'pen' ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'}`}
              title="Smooth Pen (Pressure Sensitive)"
            >
              <Pen className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('highlighter')}
              className={`p-2 rounded-lg transition-all ${tool === 'highlighter' ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'}`}
              title="Highlighter"
            >
              <Highlighter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg transition-all ${tool === 'eraser' ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'}`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('pan')}
              className={`p-2 rounded-lg transition-all ${tool === 'pan' ? 'bg-amber-500 text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'}`}
              title="Pan / Move Canvas (🖐️)"
            >
              <Hand className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('rect')}
              className={`p-2 rounded-lg transition-all ${tool === 'rect' ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'}`}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('circle')}
              className={`p-2 rounded-lg transition-all ${tool === 'circle' ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'}`}
              title="Circle"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setTool('line')}
              className={`p-2 rounded-lg transition-all ${tool === 'line' ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'}`}
              title="Line / Arrow"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w.size}
                type="button"
                onClick={() => setSize(w.size)}
                className={`px-2.5 py-1 rounded-lg text-caption font-semibold transition-all ${
                  size === w.size
                    ? 'bg-apple-secondaryBg dark:bg-white/20 text-apple-blue dark:text-white font-bold'
                    : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
                }`}
                title={`${w.label} (${w.size}px)`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Canvas Paper Theme (Light / Dark Obsidian / Grid) */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
            <button
              type="button"
              onClick={() => setCanvasBg('light')}
              className={`p-1.5 rounded-lg text-caption font-medium transition-all ${canvasBg === 'light' ? 'bg-apple-blue text-white' : 'text-apple-textSecondary'}`}
              title="White Paper"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCanvasBg('dark')}
              className={`p-1.5 rounded-lg text-caption font-medium transition-all ${canvasBg === 'dark' ? 'bg-apple-blue text-white' : 'text-apple-textSecondary'}`}
              title="Dark Obsidian Paper"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCanvasBg('grid')}
              className={`p-1.5 rounded-lg text-caption font-medium transition-all ${canvasBg === 'grid' ? 'bg-apple-blue text-white' : 'text-apple-textSecondary'}`}
              title="Math Grid Paper"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

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
              className="px-2 py-1 rounded-lg text-caption font-mono font-semibold text-apple-textSecondary hover:text-apple-blue"
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

          {/* Action Buttons: Export, Broadcast, Clear */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExportPNG}
              className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white transition-colors border border-apple-border/60 dark:border-white/10 shadow-sm"
              title="Save as PNG"
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
              onClick={() => {
                if (window.confirm('Clear all drawings on the whiteboard?')) {
                  onClearWhiteboard();
                }
              }}
              className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-red-50 dark:hover:bg-red-950 text-apple-red transition-colors border border-apple-border/60 dark:border-white/10 shadow-sm"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Apple Minimal Color Palette Swatches */}
        {tool !== 'eraser' && tool !== 'pan' && (
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
                      isSelected
                        ? 'bg-apple-blue/15 dark:bg-white/15 p-0.5'
                        : 'p-0.5 hover:scale-105'
                    }`}
                    title={c.name}
                  >
                    <span
                      className={`w-full h-full rounded-full flex items-center justify-center shadow-2xs border ${
                        isSelected
                          ? 'border-apple-blue dark:border-white'
                          : 'border-black/10 dark:border-white/20'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && (
                        <span className={`w-1.5 h-1.5 rounded-full ${c.hex === '#1C1C1E' || c.hex === '#5856D6' || c.hex === '#007AFF' || c.hex === '#E02020' || c.hex === '#6A1B9A' ? 'bg-white' : 'bg-black'}`} />
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

        {/* Infinite Canvas Stage */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          className={`relative border border-apple-border/80 dark:border-white/20 rounded-ios-card overflow-hidden shadow-inner flex items-center justify-center ${
            canvasBg === 'dark' ? 'bg-[#121212]' : 'bg-white'
          } ${
            tool === 'pan' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
          }`}
        >
          <canvas
            ref={canvasRef}
            width={1600}
            height={900}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-auto max-h-[62vh] touch-none block select-none"
          />
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between text-caption text-apple-textSecondary dark:text-white/50 px-1">
          <span>✨ Pressure-sensitive Bézier handwriting. Zero spikes.</span>
          <span>Tip: Use 🖐️ Hand or two-finger scroll to pan canvas freely.</span>
        </div>
      </div>
    </Modal>
  );
};
