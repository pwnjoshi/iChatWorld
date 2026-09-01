import React, { useState, useEffect } from 'react';
import { Member, HandRaise, Poll, ClassroomTimerState, QAQuestion } from '../../types/index.js';
import { Avatar } from '../common/Avatar.js';
import {
  QrCode,
  Copy,
  Check,
  Users,
  Shield,
  LogOut,
  Trash2,
  Layers,
  Hand,
  BarChart2,
  Moon,
  Sun,
  PenTool,
  Code2,
  HelpCircle,
  Presentation,
  Clock,
  Monitor,
  Sparkles
} from 'lucide-react';

interface RoomHeaderProps {
  roomCode: string;
  members: Member[];
  currentMember: Member | null;
  handsRaised: HandRaise[];
  activePoll?: Poll | null;
  timerState?: ClassroomTimerState | null;
  qaQuestions: QAQuestion[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenQR: () => void;
  onOpenFacultyPanel: () => void;
  onOpenRoomSwitcher: () => void;
  onOpenHandQueue: () => void;
  onOpenPollModal: () => void;
  onOpenWhiteboard: () => void;
  onOpenCodePad: () => void;
  onOpenTimerModal: () => void;
  onOpenQAModal: () => void;
  onOpenPresenter: () => void;
  onOpenAISummary?: () => void;
  onStartScreenShare: () => void;
  onToggleRaiseHand: () => void;
  onLeaveRoom: () => void;
  onEndRoom: () => void;
  onElevatePrompt: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomCode,
  members,
  currentMember,
  handsRaised,
  activePoll,
  timerState,
  qaQuestions,
  isDarkMode,
  onToggleDarkMode,
  onOpenQR,
  onOpenFacultyPanel,
  onOpenRoomSwitcher,
  onOpenHandQueue,
  onOpenPollModal,
  onOpenWhiteboard,
  onOpenCodePad,
  onOpenTimerModal,
  onOpenQAModal,
  onOpenPresenter,
  onOpenAISummary,
  onStartScreenShare,
  onToggleRaiseHand,
  onLeaveRoom,
  onEndRoom,
  onElevatePrompt
}) => {
  const [copied, setCopied] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);

  const isFacultyOrHost = currentMember?.isFaculty || currentMember?.isCreator;
  const isHandRaised = currentMember && handsRaised.some(h => h.socketId === currentMember.socketId);

  // Synchronized countdown timer tick
  useEffect(() => {
    if (!timerState || !timerState.isRunning) {
      setTimerSecondsLeft(timerState ? timerState.remainingSec : 0);
      return;
    }

    const interval = setInterval(() => {
      if (timerState.startedAt) {
        const elapsed = Math.floor((Date.now() - timerState.startedAt) / 1000);
        const remaining = Math.max(0, timerState.remainingSec - elapsed);
        setTimerSecondsLeft(remaining);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [timerState]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-apple-border/70 dark:border-white/10 px-3 py-2 transition-colors">
      <div className="max-w-[600px] mx-auto flex flex-col gap-1.5">
        {/* Top Row: Room Code, Switcher, Timer Pill, Main Actions */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Left: Switcher & Room Code */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenRoomSwitcher}
              title="Switch between rooms"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg text-apple-textPrimary dark:text-white transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-apple-blue" />
              <span className="font-mono font-bold text-headline tracking-wider text-xs md:text-sm">
                {roomCode}
              </span>
            </button>

            <button
              onClick={handleCopyCode}
              title="Copy code"
              className="p-1.5 rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10 text-apple-textSecondary transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-apple-green" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onOpenQR}
              title="Show QR Code"
              className="p-1.5 rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10 text-apple-textSecondary hover:text-apple-textPrimary transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Synchronized Timer Badge */}
          {timerState && (
            <button
              onClick={onOpenTimerModal}
              title="Classroom Timer"
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-mono font-bold transition-all ${
                timerSecondsLeft === 0
                  ? 'bg-red-500 text-white animate-bounce'
                  : timerState.isRunning
                  ? 'bg-apple-blue text-white shadow-sm animate-pulse'
                  : 'bg-apple-secondaryBg text-apple-textSecondary'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{formatTimer(timerSecondsLeft)}</span>
            </button>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            {/* Hand Raise Trigger */}
            {isFacultyOrHost ? (
              <button
                onClick={onOpenHandQueue}
                title="Raised Hands Queue"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold transition-all ${
                  handsRaised.length > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    : 'bg-apple-secondaryBg dark:bg-white/10 text-apple-textSecondary'
                }`}
              >
                <Hand className="w-3.5 h-3.5 text-amber-600" />
                <span>{handsRaised.length}</span>
              </button>
            ) : (
              <button
                onClick={onToggleRaiseHand}
                title={isHandRaised ? 'Lower your hand' : 'Raise hand to ask question'}
                className={`p-1.5 rounded-full transition-all ${
                  isHandRaised
                    ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300 scale-105'
                    : 'hover:bg-apple-secondaryBg text-apple-textSecondary hover:text-amber-600'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dark Mode */}
            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              className="p-1.5 rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10 text-apple-textSecondary transition-colors"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Members Count */}
            <div className="relative">
              <button
                onClick={() => setShowMemberList(!showMemberList)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg text-footnote font-semibold"
                title="View members"
              >
                <Users className="w-3 h-3 text-apple-textSecondary" />
                <span className="text-apple-textPrimary dark:text-white text-xs">{members.length}</span>
              </button>

              {showMemberList && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowMemberList(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1C1C1E] rounded-ios-card shadow-ios-dropdown border border-apple-border/70 dark:border-white/10 p-3 z-40 space-y-2 animate-scale-up">
                    <div className="flex items-center justify-between pb-1.5 border-b border-apple-border/40">
                      <span className="text-caption font-semibold uppercase text-apple-textSecondary">
                        Members in Room ({members.length})
                      </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1.5 py-1">
                      {members.map(m => (
                        <div
                          key={m.socketId}
                          className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-apple-secondaryBg dark:hover:bg-white/5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar name={m.displayName} isFaculty={m.isFaculty} isCreator={m.isCreator} size="sm" />
                            <span className="text-footnote text-apple-textPrimary dark:text-white truncate">
                              {m.displayName} {m.socketId === currentMember?.socketId ? '(You)' : ''}
                            </span>
                          </div>
                          {m.isFaculty && (
                            <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                              Faculty
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Faculty Controls */}
            {isFacultyOrHost ? (
              <button
                onClick={onOpenFacultyPanel}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-caption transition-colors"
              >
                <Shield className="w-3 h-3 text-amber-700" />
                <span className="hidden sm:inline">Controls</span>
              </button>
            ) : (
              <button
                onClick={onElevatePrompt}
                title="Unlock Faculty Controls"
                className="p-1.5 rounded-full text-apple-textSecondary hover:text-amber-600 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Leave / End */}
            {isFacultyOrHost ? (
              <button
                onClick={() => {
                  if (window.confirm('End this room session for everyone? All data will be deleted.')) {
                    onEndRoom();
                  }
                }}
                title="End Room"
                className="p-1.5 rounded-full text-apple-red hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (window.confirm('Leave this room?')) {
                    onLeaveRoom();
                  }
                }}
                title="Leave Room"
                className="p-1.5 rounded-full text-apple-textSecondary hover:text-apple-red transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Tool Ribbon (Whiteboard, CodePad, Q&A, Slides, Timer, Poll, Screen Share) */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5 border-t border-apple-border/40 dark:border-white/5">
          <button
            onClick={onOpenWhiteboard}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary hover:text-apple-blue hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
            title="Collaborative Freeform Whiteboard"
          >
            <PenTool className="w-3 h-3 text-apple-blue" />
            <span>Whiteboard</span>
          </button>

          <button
            onClick={onOpenCodePad}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary hover:text-emerald-500 hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
            title="Interactive Code Pad & Runner"
          >
            <Code2 className="w-3 h-3 text-apple-green" />
            <span>Code Pad</span>
          </button>

          <button
            onClick={onOpenQAModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary hover:text-purple-500 hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
            title="Anonymous Q&A Queue"
          >
            <HelpCircle className="w-3 h-3 text-purple-500" />
            <span>Q&A ({qaQuestions.length})</span>
          </button>

          <button
            onClick={onOpenPresenter}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary hover:text-amber-500 hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
            title="Synchronized Slide Deck Presenter"
          >
            <Presentation className="w-3 h-3 text-amber-500" />
            <span>Slides</span>
          </button>

          <button
            onClick={onOpenTimerModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary hover:text-apple-blue hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
            title="Focus Timer"
          >
            <Clock className="w-3 h-3 text-apple-blue" />
            <span>Timer</span>
          </button>

          {isFacultyOrHost && (
            <button
              onClick={onOpenPollModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary hover:text-apple-blue hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
              title="Classroom Poll"
            >
              <BarChart2 className="w-3 h-3 text-apple-blue" />
              <span>Poll</span>
            </button>
          )}

          {onOpenAISummary && (
            <button
              onClick={onOpenAISummary}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors shrink-0"
              title="Generate DeepSeek AI Summary & Digest"
            >
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>AI Digest</span>
            </button>
          )}

          <button
            onClick={onStartScreenShare}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary hover:text-apple-blue hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
            title="Share Screen"
          >
            <Monitor className="w-3 h-3 text-apple-blue" />
            <span>Screen</span>
          </button>
        </div>
      </div>
    </header>
  );
};
