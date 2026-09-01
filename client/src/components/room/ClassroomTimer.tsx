import React, { useState } from 'react';
import { ClassroomTimerState } from '../../types/index.js';
import { Modal } from '../common/Modal.js';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface ClassroomTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timerState?: ClassroomTimerState | null;
  onUpdateTimer: (state: ClassroomTimerState | null) => Promise<boolean>;
  isFaculty: boolean;
}

export const ClassroomTimerModal: React.FC<ClassroomTimerModalProps> = ({
  isOpen,
  onClose,
  timerState,
  onUpdateTimer,
  isFaculty
}) => {
  const [minutes, setMinutes] = useState(5);
  const [label, setLabel] = useState('Class Quiz');

  if (!isOpen) return null;

  const handleStartPreset = async (mins: number, lbl: string) => {
    const totalSec = mins * 60;
    await onUpdateTimer({
      durationSec: totalSec,
      remainingSec: totalSec,
      isRunning: true,
      startedAt: Date.now(),
      label: lbl
    });
    // Auto-close modal as requested
    onClose();
  };

  const handleTogglePlay = async () => {
    if (!timerState) return;
    await onUpdateTimer({
      ...timerState,
      isRunning: !timerState.isRunning,
      startedAt: timerState.isRunning ? null : Date.now()
    });
  };

  const handleReset = async () => {
    if (!timerState) return;
    await onUpdateTimer({
      ...timerState,
      remainingSec: timerState.durationSec,
      isRunning: false,
      startedAt: null
    });
  };

  const handleClear = async () => {
    await onUpdateTimer(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Classroom Focus Timer">
      <div className="space-y-5 text-center">
        {/* Preset Quick Buttons */}
        {isFaculty && (
          <div className="space-y-2">
            <label className="block text-footnote font-medium text-apple-textSecondary dark:text-white/70 text-left">
              Quick Presets
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 5, 10, 15].map(m => (
                <button
                  key={m}
                  onClick={() => handleStartPreset(m, `${m} Min Session`)}
                  className="py-2.5 px-3 rounded-xl bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-blue hover:text-white dark:hover:bg-apple-blue font-semibold text-footnote text-apple-textPrimary dark:text-white transition-colors border border-apple-border/50 dark:border-white/10"
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Configuration */}
        {isFaculty && (
          <div className="p-4 bg-apple-secondaryBg/70 dark:bg-white/5 rounded-ios-card border border-apple-border/50 dark:border-white/10 space-y-3 text-left">
            <label className="block text-footnote font-medium text-apple-textSecondary dark:text-white/70">
              Custom Duration & Label
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={180}
                value={minutes}
                onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3 py-2 bg-white dark:bg-[#1C1C1E] rounded-ios-input text-body font-semibold text-apple-textPrimary dark:text-white text-center border border-apple-border dark:border-white/10 outline-none focus:ring-2 focus:ring-apple-blue"
              />
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Timer label (e.g. Exam Break)"
                className="flex-1 px-3 py-2 bg-white dark:bg-[#1C1C1E] rounded-ios-input text-footnote text-apple-textPrimary dark:text-white border border-apple-border dark:border-white/10 outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>
            <button
              onClick={() => handleStartPreset(minutes, label || 'Focus Session')}
              className="w-full py-2.5 px-4 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white font-semibold text-footnote transition-colors shadow-sm"
            >
              Start Synchronized Timer
            </button>
          </div>
        )}

        {/* Timer Control Buttons */}
        {timerState && isFaculty && (
          <div className="flex gap-2 pt-2 border-t border-apple-border/50 dark:border-white/10">
            <button
              onClick={handleTogglePlay}
              className={`flex-1 py-2.5 px-4 rounded-full font-semibold text-footnote text-white transition-colors flex items-center justify-center gap-1.5 ${
                timerState.isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-apple-green hover:bg-emerald-600'
              }`}
            >
              {timerState.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{timerState.isRunning ? 'Pause' : 'Resume'}</span>
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg text-apple-textPrimary dark:text-white transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="py-2.5 px-4 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-950 text-apple-red font-semibold text-footnote transition-colors"
            >
              Stop Timer
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
