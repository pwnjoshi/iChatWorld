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
  HelpCircle,
  Presentation,
  Clock,
  Monitor,
  Star,
  BookOpen,
  Mail,
  Sparkles,
  MoreHorizontal,
  Share2,
  X
} from 'lucide-react';

import { BrandLogo } from '../common/BrandLogo.js';

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
  onOpenTimerModal: () => void;
  onOpenQAModal: () => void;
  onOpenPresenter: () => void;
  onOpenTools?: () => void;
  onOpenDocs?: () => void;
  onOpenExportNotes?: () => void;
  onStartScreenShare: () => void;
  onToggleRaiseHand: () => void;
  onLeaveRoom: () => void;
  onEndRoom: () => void;
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
  onOpenTimerModal,
  onOpenQAModal,
  onOpenPresenter,
  onOpenTools,
  onOpenDocs,
  onOpenExportNotes,
  onStartScreenShare,
  onToggleRaiseHand,
  onLeaveRoom,
  onEndRoom
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

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?code=${roomCode}` : `https://ichatworld.xyz/?code=${roomCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy link', e);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `iChatWorld — Room ${roomCode}`,
          text: `Join real-time workspace on iChatWorld:`,
          url: shareUrl
        });
      } catch (e) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-apple-border/70 dark:border-white/10 px-2.5 sm:px-4 md:px-6 py-2 transition-colors">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-1.5">
        {/* Top Row: Room Code, Switcher, Timer Pill, Main Actions */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Left: Switcher & Room Code */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <BrandLogo size="sm" />

            <button
              onClick={onOpenRoomSwitcher}
              title="Switch between rooms"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg text-apple-textPrimary dark:text-white transition-colors shadow-2xs shrink-0"
            >
              <Layers className="w-3.5 h-3.5 text-apple-blue shrink-0" />
              <span className="font-mono font-bold tracking-wider text-xs md:text-sm whitespace-nowrap">
                {roomCode}
              </span>
            </button>

            {/* Quick Share / Copy Link Button */}
            <button
              onClick={handleShare}
              title={copied ? 'Link Copied!' : 'Share or Copy Room Link'}
              className="flex p-1.5 rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10 text-apple-textSecondary hover:text-apple-blue dark:hover:text-apple-blue transition-colors shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-apple-green" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onOpenQR}
              title="Show QR Code"
              className="hidden sm:flex p-1.5 rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10 text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white transition-colors shrink-0"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>

            {/* Synchronized Timer Badge */}
            {timerState && (
              <button
                onClick={onOpenTimerModal}
                title="Classroom Timer"
                className={`hidden md:flex items-center gap-1 px-3 py-1 rounded-full text-caption font-mono font-bold transition-all shadow-sm ${
                  timerSecondsLeft === 0
                    ? 'bg-red-500 text-white animate-bounce'
                    : timerState.isRunning
                    ? 'bg-apple-blue text-white shadow-blue-500/30 shadow-md animate-pulse'
                    : 'bg-apple-secondaryBg dark:bg-white/10 text-apple-textSecondary'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(timerSecondsLeft)}</span>
              </button>
            )}
          </div>

          {/* Right Controls: Studio Tools (Mobile), Raised Hands, Theme, Members, Controls */}
          <div className="flex items-center gap-1.5">
            {/* Mobile Studio Tools Trigger Button */}
            <button
              onClick={onOpenTools}
              className="flex md:hidden items-center px-3 py-1 rounded-full bg-apple-blue text-white font-bold text-caption shadow-sm active:scale-95 transition-all"
              title="Open Studio Tools"
            >
              <span>Tools</span>
            </button>

            {/* Developer Docs Button (Desktop) */}
            {onOpenDocs && (
              <button
                onClick={onOpenDocs}
                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold text-apple-textSecondary dark:text-white/70 hover:text-apple-textPrimary dark:hover:text-white bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg transition-colors"
                title="Platform & Developer Docs"
              >
                <BookOpen className="w-3.5 h-3.5 text-apple-blue" />
                <span>Docs</span>
              </button>
            )}

            {/* GitHub Star Button (Desktop) */}
            <a
              href="https://github.com/pwnjoshi/iChatWorld"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-yellow-100 dark:hover:bg-yellow-950/40 text-apple-textPrimary dark:text-white text-[12px] font-semibold transition-all border border-apple-border/50 dark:border-white/10"
              title="Star iChatWorld on GitHub"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>Star</span>
            </a>

            {/* Hand Raise Trigger (Desktop / Tablet) */}
            {isFacultyOrHost ? (
              <button
                onClick={onOpenHandQueue}
                title="Raised Hands Queue"
                className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-caption font-semibold transition-all ${
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
                className={`hidden sm:flex p-1.5 rounded-full transition-all ${
                  isHandRaised
                    ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300 scale-105'
                    : 'hover:bg-apple-secondaryBg dark:hover:bg-white/10 text-apple-textSecondary hover:text-amber-600'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              className="p-1.5 rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10 text-apple-textSecondary transition-colors"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Members Count Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMemberList(!showMemberList)}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg text-footnote font-semibold"
                title="View members"
              >
                <Users className="w-3.5 h-3.5 text-apple-textSecondary" />
                <span className="text-apple-textPrimary dark:text-white text-xs">{members.length}</span>
              </button>

              {showMemberList && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowMemberList(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-ios-dropdown border border-apple-border dark:border-white/10 z-40 space-y-2 animate-scale-up">
                    <div className="flex items-center justify-between pb-1.5 border-b border-apple-border/50 dark:border-white/10">
                      <span className="text-caption font-semibold uppercase tracking-wider text-apple-textSecondary dark:text-white/60">
                        In Room ({members.length})
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1.5 no-scrollbar">
                      {members.map((member) => (
                        <div
                          key={member.socketId}
                          className="flex items-center justify-between p-1.5 rounded-xl hover:bg-apple-secondaryBg dark:hover:bg-white/5"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar name={member.displayName} isFaculty={member.isFaculty} size="sm" />
                            <span className="text-footnote font-medium text-apple-textPrimary dark:text-white">
                              {member.displayName} {member.socketId === currentMember?.socketId && '(You)'}
                            </span>
                          </div>
                          {(member.isFaculty || member.isCreator) && (
                            <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/60 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                              Host
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Host Controls — only visible strictly to the room creator */}
            {currentMember?.isCreator && (
              <button
                onClick={onOpenFacultyPanel}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800/60 text-amber-900 dark:text-amber-200 font-semibold text-caption transition-colors border border-amber-200/60 dark:border-amber-700/40 shrink-0"
                title="Host Moderation Controls"
              >
                <Shield className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                <span className="hidden sm:inline">Host</span>
              </button>
            )}

            {/* Leave / End — Only creator can delete/end room, others can only leave */}
            {currentMember?.isCreator ? (
              <button
                onClick={() => {
                  if (window.confirm('End this room session for everyone? All data will be permanently erased.')) {
                    onEndRoom();
                  }
                }}
                title="End Room (Creator)"
                className="p-1.5 rounded-full text-apple-red hover:bg-red-50 dark:hover:bg-red-950 transition-colors shrink-0"
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
                className="p-1.5 rounded-full text-apple-textSecondary hover:text-apple-red transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Tool Ribbon (Visible on Desktop / Tablet only to keep mobile pristine) */}
        <div className="hidden md:flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5 border-t border-apple-border/40 dark:border-white/5">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenWhiteboard}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary dark:text-white/70 hover:text-apple-blue hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
              title="Collaborative Freeform Whiteboard"
            >
              <PenTool className="w-3 h-3 text-apple-blue" />
              <span>Whiteboard</span>
            </button>

            <button
              onClick={onOpenQAModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary dark:text-white/70 hover:text-purple-500 hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
              title="Anonymous Q&A Queue"
            >
              <HelpCircle className="w-3 h-3 text-purple-500" />
              <span>Q&A ({qaQuestions.length})</span>
            </button>

            <button
              onClick={onOpenPresenter}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary dark:text-white/70 hover:text-amber-500 hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
              title="Synchronized Slide Deck Presenter"
            >
              <Presentation className="w-3 h-3 text-amber-500" />
              <span>Slides</span>
            </button>

            <button
              onClick={onOpenTimerModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary dark:text-white/70 hover:text-apple-blue hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
              title="Focus Timer"
            >
              <Clock className="w-3 h-3 text-apple-blue" />
              <span>Timer</span>
            </button>

            {isFacultyOrHost && (
              <button
                onClick={onOpenPollModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary dark:text-white/70 hover:text-apple-blue hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
                title="Classroom Poll"
              >
                <BarChart2 className="w-3 h-3 text-apple-blue" />
                <span>Poll</span>
              </button>
            )}

            <button
              onClick={onStartScreenShare}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-textSecondary dark:text-white/70 hover:text-apple-blue hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
              title="Share Screen"
            >
              <Monitor className="w-3 h-3 text-apple-blue" />
              <span>Screen</span>
            </button>

            {onOpenExportNotes && (
              <button
                onClick={onOpenExportNotes}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-apple-blue hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors shrink-0 border border-blue-200/60 dark:border-blue-900/40"
                title="Export Notes & Homework Package"
              >
                <Mail className="w-3 h-3 text-apple-blue" />
                <span>Export Notes</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
