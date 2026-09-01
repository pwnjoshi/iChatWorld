import React, { useRef, useEffect, useState } from 'react';
import { Monitor, Maximize2, Minimize2, Square, Move } from 'lucide-react';

interface ScreenShareViewerProps {
  stream: MediaStream | null;
  presenterName?: string;
  isPresenter: boolean;
  onStartShare: () => Promise<void>;
  onStopShare: () => void;
}

export const ScreenShareViewer: React.FC<ScreenShareViewerProps> = ({
  stream,
  presenterName = 'Presenter',
  isPresenter,
  onStartShare,
  onStopShare
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Draggable PiP positioning
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialPosX: number; initialPosY: number }>({
    startX: 0,
    startY: 0,
    initialPosX: 0,
    initialPosY: 0
  });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isFullscreen) return;
    const currentX = pos ? pos.x : (window.innerWidth - 380);
    const currentY = pos ? pos.y : (window.innerHeight - 280);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: currentX,
      initialPosY: currentY
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const newX = Math.max(10, Math.min(window.innerWidth - 260, dragStartRef.current.initialPosX + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - 180, dragStartRef.current.initialPosY + deltaY));

    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  if (!stream && !isPresenter) return null;

  if (!stream && isPresenter) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={onStartShare}
          className="flex items-center gap-2 py-2.5 px-4 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white shadow-ios-card font-semibold text-footnote transition-all active:scale-95"
        >
          <Monitor className="w-4 h-4" />
          <span>Share Screen</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={
        !isFullscreen && pos
          ? {
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              position: 'fixed'
            }
          : undefined
      }
      className={`fixed z-40 shadow-2xl rounded-2xl overflow-hidden bg-black border border-white/20 select-none ${
        isFullscreen
          ? 'inset-4 flex flex-col'
          : !pos
          ? 'bottom-20 right-4'
          : ''
      } ${
        !isFullscreen
          ? isMinimized
            ? 'w-60 h-40'
            : 'w-80 md:w-96 h-56 md:h-64'
          : ''
      }`}
    >
      {/* Draggable Header Bar */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`flex items-center justify-between px-3 py-2 bg-black/90 backdrop-blur text-white text-caption border-b border-white/10 ${
          !isFullscreen ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate pointer-events-none">
          <Monitor className="w-3.5 h-3.5 text-apple-blue shrink-0" />
          <span className="font-semibold truncate">
            {isPresenter ? 'Your Screen' : `${presenterName}'s Screen`}
          </span>
          {!isFullscreen && (
            <span className="text-[10px] text-white/40 flex items-center gap-0.5">
              <Move className="w-2.5 h-2.5" /> Drag
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {isPresenter && (
            <button
              onClick={onStopShare}
              className="p-1 hover:bg-red-500/30 text-apple-red rounded transition-colors"
              title="Stop Sharing"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>
      </div>

      {/* Video Content */}
      <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden h-[calc(100%-36px)]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isPresenter}
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
    </div>
  );
};
