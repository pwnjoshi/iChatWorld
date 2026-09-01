import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PresenterState, PresenterSlide, WhiteboardStroke, WhiteboardPoint } from '../../types/index.js';
import { Modal } from '../common/Modal.js';
import { getApiUrl } from '../../config.js';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Flame,
  Pen,
  Highlighter,
  Eraser,
  Trash2,
  Sparkles,
  Plus,
  RotateCcw
} from 'lucide-react';

interface SlidePresenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  presenterState?: PresenterState | null;
  laserPos?: { x: number; y: number } | null;
  onSyncPresenter: (state: PresenterState | null) => Promise<boolean>;
  onEmitLaserMove: (pos: { x: number; y: number } | null) => void;
  onAnnotateSlide?: (slideIndex: number, stroke: WhiteboardStroke) => void;
  onClearSlideAnnotations?: (slideIndex: number) => void;
  isFaculty: boolean;
}

export const SlidePresenterModal: React.FC<SlidePresenterModalProps> = ({
  isOpen,
  onClose,
  presenterState,
  laserPos,
  onSyncPresenter,
  onEmitLaserMove,
  onAnnotateSlide,
  onClearSlideAnnotations,
  isFaculty
}) => {
  const [slides, setSlides] = useState<PresenterSlide[]>(presenterState?.slides || []);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(presenterState?.currentSlide || 0);
  const [activeTool, setActiveTool] = useState<'laser' | 'pen' | 'highlighter' | 'eraser'>('laser');
  const [penColor, setPenColor] = useState('#FF3B30'); // Default vivid annotation red
  const [isUploading, setIsUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPointsRef = useRef<WhiteboardPoint[]>([]);
  const isDrawingRef = useRef(false);

  // Sync slides and slide index from props
  useEffect(() => {
    if (presenterState) {
      if (presenterState.slides && presenterState.slides.length > 0) {
        setSlides(presenterState.slides);
      }
      if (presenterState.currentSlide !== undefined) {
        setCurrentSlideIndex(presenterState.currentSlide);
      }
    }
  }, [presenterState]);

  // Redraw annotations on canvas for active slide
  const redrawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const slideStrokes = presenterState?.annotations?.[currentSlideIndex] || [];

    for (const stroke of slideStrokes) {
      drawStroke(ctx, stroke);
    }
  }, [presenterState?.annotations, currentSlideIndex]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(redrawAnnotations, 50);
    }
  }, [isOpen, currentSlideIndex, redrawAnnotations]);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: WhiteboardStroke) => {
    const points = stroke.points;
    if (!points || points.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = stroke.size * 3;
    } else if (stroke.type === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
    }

    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.fill();
    } else {
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

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

  // Upload slides via ephemeral server relay endpoint
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);

    const newSlides: PresenterSlide[] = [...slides];
    for (const file of Array.from(e.target.files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(getApiUrl('/api/relay/upload'), {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const json = await res.json();
          newSlides.push({
            id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url: json.downloadUrl,
            name: file.name
          });
        } else {
          // Fallback to blob URL if offline
          newSlides.push({
            id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url: URL.createObjectURL(file),
            name: file.name
          });
        }
      } catch {
        newSlides.push({
          id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          url: URL.createObjectURL(file),
          name: file.name
        });
      }
    }

    setSlides(newSlides);
    setIsUploading(false);

    if (isFaculty) {
      await onSyncPresenter({
        active: true,
        presenterId: 'faculty',
        presenterName: 'Faculty',
        currentSlide: currentSlideIndex,
        totalSlides: newSlides.length,
        slides: newSlides,
        slideUrl: newSlides[currentSlideIndex]?.url
      });
    }
  };

  const handleSelectSlide = async (index: number) => {
    setCurrentSlideIndex(index);
    if (isFaculty) {
      await onSyncPresenter({
        active: true,
        presenterId: 'faculty',
        presenterName: 'Faculty',
        currentSlide: index,
        totalSlides: slides.length,
        slides,
        slideUrl: slides[index]?.url
      });
    }
  };

  const handleDeleteSlide = async (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this slide from the deck?')) return;

    const filtered = slides.filter((_, idx) => idx !== indexToDelete);
    const newIdx = Math.max(0, Math.min(currentSlideIndex, filtered.length - 1));

    setSlides(filtered);
    setCurrentSlideIndex(newIdx);

    if (isFaculty) {
      await onSyncPresenter({
        active: filtered.length > 0,
        presenterId: 'faculty',
        presenterName: 'Faculty',
        currentSlide: newIdx,
        totalSlides: filtered.length,
        slides: filtered,
        slideUrl: filtered[newIdx]?.url
      });
    }
  };

  const handleClearDeck = async () => {
    if (!window.confirm('Clear entire slide presentation?')) return;
    setSlides([]);
    setCurrentSlideIndex(0);
    if (isFaculty) {
      await onSyncPresenter({
        active: false,
        presenterId: 'faculty',
        presenterName: 'Faculty',
        currentSlide: 0,
        totalSlides: 0,
        slides: [],
        slideUrl: undefined
      });
    }
  };

  const handleClearAnnotations = () => {
    if (onClearSlideAnnotations) {
      onClearSlideAnnotations(currentSlideIndex);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // Pointer event handlers for drawing / laser tracking
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): WhiteboardPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isFaculty) return;
    if (activeTool === 'laser') return;

    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    isDrawingRef.current = true;
    const pt = getCanvasCoords(e);
    currentPointsRef.current = [pt];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isFaculty) return;

    if (activeTool === 'laser' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onEmitLaserMove({ x, y });
      return;
    }

    if (!isDrawingRef.current) return;
    e.preventDefault();

    const pt = getCanvasCoords(e);
    currentPointsRef.current.push(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    redrawAnnotations();
    drawStroke(ctx, {
      id: 'active',
      type: activeTool === 'laser' ? 'pen' : activeTool,
      color: penColor,
      size: activeTool === 'highlighter' ? 12 : 4,
      points: currentPointsRef.current
    });
  };

  const handlePointerUp = () => {
    if (!isFaculty || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPointsRef.current.length > 0 && onAnnotateSlide) {
      const newStroke: WhiteboardStroke = {
        id: `slide-stroke-${Date.now()}`,
        type: activeTool === 'laser' ? 'pen' : activeTool,
        color: penColor,
        size: activeTool === 'highlighter' ? 12 : 4,
        points: [...currentPointsRef.current]
      };
      onAnnotateSlide(currentSlideIndex, newStroke);
      currentPointsRef.current = [];
    }
  };

  const handleMouseLeave = () => {
    if (isFaculty) {
      onEmitLaserMove(null);
    }
  };

  const currentSlide = slides[currentSlideIndex] || (presenterState?.slideUrl ? { url: presenterState.slideUrl, name: 'Slide' } : null);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Synchronized Slide Presenter Studio" maxWidth="max-w-5xl">
      <div className="space-y-3 select-none">
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-apple-secondaryBg dark:bg-white/5 rounded-ios-card border border-apple-border/70 dark:border-white/10">
          {/* Faculty Upload & Tools */}
          <div className="flex items-center gap-1.5">
            {isFaculty && (
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-apple-blue hover:bg-apple-blueHover text-white font-semibold text-caption shadow-sm cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload Slides'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}

            {/* Annotation Tools */}
            {isFaculty && (
              <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1E] p-1 rounded-xl border border-apple-border/60 dark:border-white/10 shadow-sm">
                <button
                  type="button"
                  onClick={() => setActiveTool('laser')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-caption font-semibold transition-all ${
                    activeTool === 'laser' ? 'bg-red-500 text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
                  }`}
                  title="Red Laser Pointer"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Laser</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('pen')}
                  className={`p-1.5 rounded-lg transition-all ${
                    activeTool === 'pen' ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
                  }`}
                  title="Slide Pen / Marker"
                >
                  <Pen className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('highlighter')}
                  className={`p-1.5 rounded-lg transition-all ${
                    activeTool === 'highlighter' ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
                  }`}
                  title="Highlighter"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('eraser')}
                  className={`p-1.5 rounded-lg transition-all ${
                    activeTool === 'eraser' ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
                  }`}
                  title="Eraser"
                >
                  <Eraser className="w-3.5 h-3.5" />
                </button>

                {activeTool === 'pen' && (
                  <input
                    type="color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent ml-1"
                    title="Pen Color"
                  />
                )}
              </div>
            )}

            {isFaculty && (
              <button
                onClick={handleClearAnnotations}
                className="p-2 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white border border-apple-border/60 dark:border-white/10 shadow-sm"
                title="Clear Annotations on Current Slide"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <span className="text-caption font-semibold text-apple-textSecondary dark:text-white/60">
              Slide {slides.length > 0 ? currentSlideIndex + 1 : 0} of {slides.length || presenterState?.totalSlides || 0}
            </span>

            {isFaculty && slides.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSelectSlide(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex <= 0}
                  className="p-1.5 rounded-full bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg dark:hover:bg-white/10 disabled:opacity-30 transition-colors border border-apple-border/60 dark:border-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSelectSlide(Math.min(slides.length - 1, currentSlideIndex + 1))}
                  disabled={currentSlideIndex >= slides.length - 1}
                  className="p-1.5 rounded-full bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg dark:hover:bg-white/10 disabled:opacity-30 transition-colors border border-apple-border/60 dark:border-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClearDeck}
                  className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950 text-apple-red transition-colors border border-apple-border/60 dark:border-white/10"
                  title="Clear Entire Deck"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Slide Stage with Canvas Annotation Layer & Laser Pointer */}
        <div
          ref={containerRef}
          onMouseLeave={handleMouseLeave}
          className="relative min-h-[380px] max-h-[60vh] bg-black rounded-ios-card overflow-hidden flex items-center justify-center border border-apple-border/70 dark:border-white/10 select-none shadow-inner"
        >
          {currentSlide?.url ? (
            <>
              <img
                src={currentSlide.url}
                alt={`Slide ${currentSlideIndex + 1}`}
                className="max-h-[60vh] w-auto object-contain mx-auto pointer-events-none"
              />

              {/* Live Annotation Drawing Canvas */}
              <canvas
                ref={canvasRef}
                width={1200}
                height={800}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`absolute inset-0 w-full h-full object-contain ${
                  isFaculty && activeTool !== 'laser' ? 'cursor-crosshair' : (activeTool === 'laser' ? 'cursor-none' : 'pointer-events-none')
                }`}
              />
            </>
          ) : (
            <div className="text-center p-8 text-white/60 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto opacity-40 text-apple-blue" />
              <p className="text-subhead font-medium text-white">No slide deck loaded</p>
              <p className="text-caption text-white/50">
                {isFaculty ? 'Upload slide images above to broadcast to students.' : 'Waiting for instructor to load presentation...'}
              </p>
            </div>
          )}

          {/* Red Laser Pointer Dot */}
          {laserPos && (
            <div
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-red-500 shadow-[0_0_12px_4px_rgba(255,0,0,0.8)] pointer-events-none transition-all duration-75 z-30 animate-pulse"
              style={{
                left: `${laserPos.x}%`,
                top: `${laserPos.y}%`
              }}
            />
          )}
        </div>

        {/* Thumbnail Filmstrip & Delete Slide */}
        {slides.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto p-2 bg-apple-secondaryBg/60 dark:bg-white/5 rounded-xl border border-apple-border/40 dark:border-white/10 no-scrollbar">
            {slides.map((s, idx) => (
              <div
                key={s.id || idx}
                onClick={() => handleSelectSlide(idx)}
                className={`relative shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all group ${
                  idx === currentSlideIndex
                    ? 'border-apple-blue ring-2 ring-apple-blue/30 scale-105 shadow-sm'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-black/70 text-white px-1.5 rounded">
                  {idx + 1}
                </span>

                {isFaculty && (
                  <button
                    onClick={(e) => handleDeleteSlide(idx, e)}
                    className="absolute top-1 right-1 p-1 rounded bg-black/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Slide"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
