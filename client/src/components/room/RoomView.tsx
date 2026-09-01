import React, { useState, useEffect } from 'react';
import {
  RoomState,
  Member,
  FileMetadata,
  TransferProgress,
  ActiveSessionRoom,
  HandRaise,
  Poll,
  WhiteboardStroke,
  QAQuestion,
  ClassroomTimerState,
  PresenterState
} from '../../types/index.js';
import { RoomHeader } from './RoomHeader.js';
import { ChatPanel } from './ChatPanel.js';
import { FilePanel } from './FilePanel.js';
import { FacultySlideOver } from './FacultySlideOver.js';
import { QRModal } from './QRModal.js';
import { RoomSwitcherModal } from './RoomSwitcherModal.js';
import { HandRaiseModal } from './HandRaiseQueue.js';
import { PollModal } from './PollModal.js';
import { WhiteboardModal } from './WhiteboardModal.js';
import { ClassroomTimerModal } from './ClassroomTimer.js';
import { QAQueueModal } from './QAQueueModal.js';
import { SlidePresenterModal } from './SlidePresenterModal.js';
import { DeveloperDocsModal } from '../docs/DeveloperDocsModal.js';
import { ExportNotesModal } from './ExportNotesModal.js';
import { ScreenShareViewer } from './ScreenShareViewer.js';
import { Modal } from '../common/Modal.js';
import {
  MessageSquare,
  Folder,
  Shield,
  PenTool,
  HelpCircle,
  Presentation,
  BarChart2,
  Clock,
  Play,
  Pause,
  X,
  Monitor,
  Sparkles,
  Users
} from 'lucide-react';
import { formatFileSize } from '../../utils/format.js';

interface RoomViewProps {
  room: RoomState;
  currentMember: Member | null;
  activeRooms: ActiveSessionRoom[];
  typingUsers: Map<string, string>;
  transfers: Map<string, TransferProgress>;
  downloadedBlobs: Map<string, string>;
  screenStream: MediaStream | null;
  screenPresenterName?: string;
  laserPos?: { x: number; y: number } | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSwitchRoom: (code: string) => void;
  onJoinNewRoom: (code: string) => void;
  onCreateNewRoom: () => void;
  onRemoveRoomFromHistory: (code: string) => void;
  onSendMessage: (text: string, isCode?: boolean, codeLanguage?: string) => Promise<boolean>;
  onEditMessage?: (messageId: string, newText: string) => Promise<boolean>;
  onDeleteMessage?: (messageId: string) => Promise<boolean>;
  onSendAudio: (blob: Blob, duration: number) => Promise<boolean>;
  onReactToMessage: (messageId: string, emoji: string) => Promise<boolean>;
  onSendTyping: (isTyping: boolean) => void;
  onEmitWhiteboardStroke: (stroke: WhiteboardStroke) => void;
  onClearWhiteboard: () => void;
  onEmitWhiteboardCursor?: (x: number, y: number, isDrawing?: boolean) => void;
  remoteWhiteboardCursors?: Map<string, { x: number; y: number; userName: string; isFaculty: boolean; isDrawing: boolean; lastUpdated: number }>;
  onUpdateTimerState: (state: ClassroomTimerState | null) => Promise<boolean>;
  onAskQAQuestion: (text: string, isAnonymous: boolean) => Promise<boolean>;
  onEditQAQuestion?: (questionId: string, text: string) => Promise<boolean>;
  onAnswerQAQuestion?: (questionId: string, text: string) => Promise<boolean>;
  onUpvoteQAQuestion: (questionId: string) => Promise<boolean>;
  onUpvoteQAAnswer?: (questionId: string, answerId: string) => Promise<boolean>;
  onToggleAnswerQA: (questionId: string) => Promise<boolean>;
  onSyncPresenter: (state: PresenterState | null) => Promise<boolean>;
  onEmitLaserMove: (pos: { x: number; y: number } | null) => void;
  onAnnotateSlide?: (slideIndex: number, stroke: WhiteboardStroke) => void;
  onClearSlideAnnotations?: (slideIndex: number) => void;
  onStartScreenShare: () => Promise<void>;
  onStopScreenShare: () => void;
  onRaiseHand: () => Promise<boolean>;
  onLowerHand: (targetSocketId?: string) => Promise<boolean>;
  onLowerAllHands: () => Promise<boolean>;
  onCreatePoll: (question: string, options: string[]) => Promise<boolean>;
  onVotePoll: (pollId: string, optionId: string) => Promise<boolean>;
  onClosePoll: (pollId: string) => Promise<boolean>;
  onDeletePoll?: (pollId: string) => Promise<boolean>;
  onUploadFile: (file: File, isBroadcast?: boolean) => Promise<any>;
  onDownloadFile: (file: FileMetadata) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<boolean>;
  onToggleMute: (muted: boolean) => Promise<boolean>;
  onPinAnnouncement: (text: string | null) => Promise<boolean>;
  onKickMember: (socketId: string) => Promise<boolean>;
  onElevateFaculty: (passphrase: string) => Promise<boolean>;
  onEndRoom: () => Promise<boolean>;
  onLeaveRoom: () => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  room,
  currentMember,
  activeRooms,
  typingUsers,
  transfers,
  downloadedBlobs,
  screenStream,
  screenPresenterName,
  laserPos,
  isDarkMode,
  onToggleDarkMode,
  onSwitchRoom,
  onJoinNewRoom,
  onCreateNewRoom,
  onRemoveRoomFromHistory,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onSendAudio,
  onReactToMessage,
  onSendTyping,
  onEmitWhiteboardStroke,
  onClearWhiteboard,
  onEmitWhiteboardCursor,
  remoteWhiteboardCursors,
  onUpdateTimerState,
  onAskQAQuestion,
  onEditQAQuestion,
  onAnswerQAQuestion,
  onUpvoteQAQuestion,
  onUpvoteQAAnswer,
  onToggleAnswerQA,
  onSyncPresenter,
  onEmitLaserMove,
  onAnnotateSlide,
  onClearSlideAnnotations,
  onStartScreenShare,
  onStopScreenShare,
  onRaiseHand,
  onLowerHand,
  onLowerAllHands,
  onCreatePoll,
  onVotePoll,
  onClosePoll,
  onDeletePoll,
  onUploadFile,
  onDownloadFile,
  onDeleteFile,
  onToggleMute,
  onPinAnnouncement,
  onKickMember,
  onElevateFaculty,
  onEndRoom,
  onLeaveRoom
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'files'>('chat');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isFacultySlideOverOpen, setIsFacultySlideOverOpen] = useState(false);
  const [isRoomSwitcherOpen, setIsRoomSwitcherOpen] = useState(false);
  const [isHandQueueOpen, setIsHandQueueOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isQAModalOpen, setIsQAModalOpen] = useState(false);
  const [isPresenterModalOpen, setIsPresenterModalOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isExportNotesOpen, setIsExportNotesOpen] = useState(false);
  const [isElevateModalOpen, setIsElevateModalOpen] = useState(false);
  const [elevatePassphrase, setElevatePassphrase] = useState('');
  const [elevateError, setElevateError] = useState('');

  // Real-time local timer computation
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  useEffect(() => {
    if (!room?.timerState) {
      setTimerSecondsLeft(0);
      return;
    }
    const timer = room.timerState;
    if (!timer.isRunning) {
      setTimerSecondsLeft(timer.remainingSec);
      return;
    }
    const update = () => {
      const elapsed = Math.floor((Date.now() - (timer.startedAt || Date.now())) / 1000);
      const left = Math.max(0, timer.remainingSec - elapsed);
      setTimerSecondsLeft(left);
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [room?.timerState]);

  const isFacultyOrHost = currentMember?.isFaculty || currentMember?.isCreator;
  const isHandRaised = currentMember && room.handsRaised?.some(h => h.socketId === currentMember.socketId);

  const handleToggleRaiseHand = async () => {
    if (isHandRaised) {
      await onLowerHand();
    } else {
      await onRaiseHand();
    }
  };

  const handleElevateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elevatePassphrase.trim()) {
      setElevateError('Please enter passphrase');
      return;
    }

    const success = await onElevateFaculty(elevatePassphrase.trim());
    if (success) {
      setIsElevateModalOpen(false);
      setElevatePassphrase('');
      setElevateError('');
    } else {
      setElevateError('Invalid faculty passphrase');
    }
  };

  const handleBroadcastFile = async (file: File) => {
    await onUploadFile(file, true);
    setIsFacultySlideOverOpen(false);
  };

  const handleShareCodeToChat = async (codeText: string, language: string) => {
    return onSendMessage(codeText, true, language);
  };

  const handleShareFileInChat = (file: FileMetadata) => {
    onSendMessage(`📎 Shared file: ${file.filename} (${formatFileSize(file.size)})`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-apple-primaryBg dark:bg-black select-none">
      {/* Header */}
      <RoomHeader
        roomCode={room.code}
        members={room.members}
        currentMember={currentMember}
        handsRaised={room.handsRaised || []}
        activePoll={room.activePoll}
        timerState={room.timerState}
        qaQuestions={room.qaQuestions || []}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
        onOpenQR={() => setIsQrOpen(true)}
        onOpenFacultyPanel={() => setIsFacultySlideOverOpen(true)}
        onOpenRoomSwitcher={() => setIsRoomSwitcherOpen(true)}
        onOpenHandQueue={() => setIsHandQueueOpen(true)}
        onOpenPollModal={() => setIsPollModalOpen(true)}
        onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
        onOpenTimerModal={() => setIsTimerModalOpen(true)}
        onOpenQAModal={() => setIsQAModalOpen(true)}
        onOpenPresenter={() => setIsPresenterModalOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenExportNotes={() => setIsExportNotesOpen(true)}
        onStartScreenShare={onStartScreenShare}
        onToggleRaiseHand={handleToggleRaiseHand}
        onLeaveRoom={onLeaveRoom}
        onEndRoom={onEndRoom}
        onElevatePrompt={() => setIsElevateModalOpen(true)}
      />

      {/* Prominent Synchronized Focus Timer Island */}
      {room.timerState && (
        <div className="shrink-0 px-4 py-2 bg-gradient-to-r from-apple-blue/10 via-purple-500/10 to-apple-blue/10 dark:from-white/5 dark:via-white/10 dark:to-white/5 border-b border-apple-border/60 dark:border-white/10 flex items-center justify-between gap-3 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-1.5 rounded-xl shrink-0 ${timerSecondsLeft === 0 ? 'bg-red-500 text-white animate-bounce' : room.timerState.isRunning ? 'bg-apple-blue text-white animate-pulse' : 'bg-apple-secondaryBg dark:bg-white/10 text-apple-textSecondary'}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-body tracking-wider text-apple-textPrimary dark:text-white">
                  {Math.floor(timerSecondsLeft / 60).toString().padStart(2, '0')}:{(timerSecondsLeft % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-caption font-semibold text-apple-textSecondary dark:text-white/60 truncate">
                  • {room.timerState.label || 'Focus Session'}
                </span>
                {timerSecondsLeft === 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    Time's Up! ⏰
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Timer Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isFacultyOrHost && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    if (!room.timerState) return;
                    await onUpdateTimerState({
                      ...room.timerState,
                      remainingSec: timerSecondsLeft,
                      isRunning: !room.timerState.isRunning,
                      startedAt: room.timerState.isRunning ? null : Date.now()
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-textPrimary dark:text-white font-semibold text-caption border border-apple-border/70 dark:border-white/10 shadow-2xs transition-all flex items-center gap-1"
                >
                  {room.timerState.isRunning ? <Pause className="w-3 h-3 text-amber-500" /> : <Play className="w-3 h-3 text-apple-green" />}
                  <span>{room.timerState.isRunning ? 'Pause' : 'Resume'}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await onUpdateTimerState(null);
                  }}
                  className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-apple-textSecondary hover:text-apple-red transition-colors"
                  title="Dismiss Timer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsTimerModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-apple-blue hover:bg-apple-blueHover text-white font-semibold text-caption shadow-2xs transition-all"
            >
              Open Controls
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP SPLIT-SCREEN WORKSPACE (lg & xl screens - Contained with side margins) */}
      <div className="hidden lg:flex flex-col flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3.5 overflow-hidden">
        <div className="grid grid-cols-12 flex-1 min-h-0 overflow-hidden rounded-3xl border border-apple-border/70 dark:border-white/10 shadow-ios-card divide-x divide-apple-border/50 dark:divide-white/10 bg-white/70 dark:bg-[#1C1C1E]/60 backdrop-blur-xl">
          {/* Left Column (65%): Live Chat Feed */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-0 overflow-hidden bg-white/40 dark:bg-black/30">
            <ChatPanel
              messages={room.messages}
              currentMember={currentMember}
              chatMuted={room.chatMuted}
              pinnedAnnouncement={room.pinnedAnnouncement}
              activePoll={room.activePoll}
              typingUsers={typingUsers}
              onSendMessage={onSendMessage}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
              onSendAudio={onSendAudio}
              onReactToMessage={onReactToMessage}
              onVotePoll={onVotePoll}
              onClosePoll={onClosePoll}
              onDeletePoll={onDeletePoll}
              onSendTyping={onSendTyping}
            />
          </div>

          {/* Right Column (35%): Live Files & Classroom Studio Side-Deck */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full min-h-0 overflow-hidden bg-apple-secondaryBg/30 dark:bg-white/5">
            {/* Top: Files Panel */}
            <div className="flex-1 min-h-0 overflow-hidden border-b border-apple-border/50 dark:border-white/10 flex flex-col">
              <div className="p-3 bg-white/90 dark:bg-black/40 border-b border-apple-border/40 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-apple-blue" />
                  <span className="text-footnote font-bold text-apple-textPrimary dark:text-white">
                    Shared Files ({room.files.length})
                  </span>
                </div>
                <span className="text-[11px] text-apple-textSecondary dark:text-white/50 font-mono">
                  WebRTC P2P Mesh
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <FilePanel
                  files={room.files}
                  transfers={transfers}
                  downloadedBlobs={downloadedBlobs}
                  currentMember={currentMember}
                  onUploadFile={onUploadFile}
                  onDownloadFile={onDownloadFile}
                  onDeleteFile={onDeleteFile}
                  onShareInChat={handleShareFileInChat}
                />
              </div>
            </div>

            {/* Bottom: Studio Quick Tools & Participants Sidebar */}
            <div className="p-4 bg-white/80 dark:bg-[#1C1C1E]/80 space-y-3 shrink-0 border-t border-apple-border/40 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-caption font-bold uppercase tracking-wider text-apple-textSecondary dark:text-white/60">
                  Classroom Studio Tools
                </span>
                <span className="text-[11px] text-apple-blue font-semibold">
                  {room.members.length} Active in Room
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setIsWhiteboardOpen(true)}
                  className="p-2.5 rounded-2xl bg-white dark:bg-[#2C2C2E] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-apple-border/60 dark:border-white/10 text-left transition-all active:scale-95 shadow-2xs group"
                >
                  <PenTool className="w-4 h-4 text-apple-blue mb-1 transition-transform group-hover:scale-110" />
                  <p className="text-caption font-bold text-apple-textPrimary dark:text-white leading-tight">Whiteboard</p>
                  <p className="text-[10px] text-apple-textSecondary dark:text-white/50">Draw & Sync</p>
                </button>

                <button
                  onClick={() => setIsExportNotesOpen(true)}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#2C2C2E] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-apple-border/60 dark:border-white/10 text-left transition-all active:scale-95 shadow-2xs group"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500 mb-1 transition-transform group-hover:scale-110" />
                  <p className="text-caption font-bold text-apple-textPrimary dark:text-white leading-tight">Export</p>
                  <p className="text-[10px] text-apple-textSecondary dark:text-white/50">Notes & OTP</p>
                </button>

                <button
                  onClick={() => setIsPresenterModalOpen(true)}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#2C2C2E] hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-apple-border/60 dark:border-white/10 text-left transition-all active:scale-95 shadow-2xs group"
                >
                  <Presentation className="w-4 h-4 text-amber-500 mb-1 transition-transform group-hover:scale-110" />
                  <p className="text-caption font-bold text-apple-textPrimary dark:text-white leading-tight">Slides</p>
                  <p className="text-[10px] text-apple-textSecondary dark:text-white/50">Deck & Laser</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE / TABLET VIEW (Compact Tabbed Switcher) */}
      <div className="flex lg:hidden flex-col flex-1 min-h-0 overflow-hidden">
        {/* Segmented Chat / Files Switcher Bar */}
        <div className="px-3 py-1.5 bg-white/80 dark:bg-black/80 backdrop-blur border-b border-apple-border/40 dark:border-white/10 shrink-0">
          <div className="flex p-0.5 bg-apple-secondaryBg dark:bg-white/10 rounded-full max-w-xs mx-auto">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-footnote font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-[#1C1C1E] text-apple-textPrimary dark:text-white shadow-xs'
                  : 'text-apple-textSecondary dark:text-white/60 hover:text-apple-textPrimary dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat ({room.messages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-footnote font-semibold transition-all ${
                activeTab === 'files'
                  ? 'bg-white dark:bg-[#1C1C1E] text-apple-textPrimary dark:text-white shadow-xs'
                  : 'text-apple-textSecondary dark:text-white/60 hover:text-apple-textPrimary dark:hover:text-white'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Files ({room.files.length})</span>
            </button>
          </div>
        </div>

        {/* Mobile Studio Quick-Action Bar */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-apple-secondaryBg/40 dark:bg-white/5 border-b border-apple-border/40 dark:border-white/5 overflow-x-auto no-scrollbar touch-pan-x shrink-0 select-none">
          <button
            onClick={() => setIsWhiteboardOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#1C1C1E] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-apple-textPrimary dark:text-white border border-apple-border/60 dark:border-white/10 text-[11px] font-bold shrink-0 shadow-2xs active:scale-95 transition-all"
          >
            <PenTool className="w-3.5 h-3.5 text-apple-blue" />
            <span>Whiteboard</span>
          </button>

          <button
            onClick={() => setIsQAModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#1C1C1E] hover:bg-purple-50 dark:hover:bg-purple-950/40 text-apple-textPrimary dark:text-white border border-apple-border/60 dark:border-white/10 text-[11px] font-bold shrink-0 shadow-2xs active:scale-95 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
            <span>Q&A ({room.qaQuestions?.length || 0})</span>
          </button>

          <button
            onClick={() => setIsPresenterModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#1C1C1E] hover:bg-amber-50 dark:hover:bg-amber-950/40 text-apple-textPrimary dark:text-white border border-apple-border/60 dark:border-white/10 text-[11px] font-bold shrink-0 shadow-2xs active:scale-95 transition-all"
          >
            <Presentation className="w-3.5 h-3.5 text-amber-500" />
            <span>Slides</span>
          </button>

          <button
            onClick={() => setIsTimerModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#1C1C1E] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-apple-textPrimary dark:text-white border border-apple-border/60 dark:border-white/10 text-[11px] font-bold shrink-0 shadow-2xs active:scale-95 transition-all"
          >
            <Clock className="w-3.5 h-3.5 text-apple-blue" />
            <span>Timer</span>
          </button>

          {isFacultyOrHost && (
            <button
              onClick={() => setIsPollModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#1C1C1E] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-apple-textPrimary dark:text-white border border-apple-border/60 dark:border-white/10 text-[11px] font-bold shrink-0 shadow-2xs active:scale-95 transition-all"
            >
              <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Poll</span>
            </button>
          )}

          <button
            onClick={() => setIsExportNotesOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#1C1C1E] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-apple-textPrimary dark:text-white border border-apple-border/60 dark:border-white/10 text-[11px] font-bold shrink-0 shadow-2xs active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export</span>
          </button>

          <button
            onClick={onStartScreenShare}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#1C1C1E] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-apple-textPrimary dark:text-white border border-apple-border/60 dark:border-white/10 text-[11px] font-bold shrink-0 shadow-2xs active:scale-95 transition-all"
          >
            <Monitor className="w-3.5 h-3.5 text-apple-blue" />
            <span>Screen</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'chat' ? (
            <ChatPanel
              messages={room.messages}
              currentMember={currentMember}
              chatMuted={room.chatMuted}
              pinnedAnnouncement={room.pinnedAnnouncement}
              activePoll={room.activePoll}
              typingUsers={typingUsers}
              onSendMessage={onSendMessage}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
              onSendAudio={onSendAudio}
              onReactToMessage={onReactToMessage}
              onVotePoll={onVotePoll}
              onClosePoll={onClosePoll}
              onDeletePoll={onDeletePoll}
              onSendTyping={onSendTyping}
            />
          ) : (
            <FilePanel
              files={room.files}
              transfers={transfers}
              downloadedBlobs={downloadedBlobs}
              currentMember={currentMember}
              onUploadFile={onUploadFile}
              onDownloadFile={onDownloadFile}
              onDeleteFile={onDeleteFile}
              onShareInChat={handleShareFileInChat}
            />
          )}
        </div>
      </div>

      {/* Floating Draggable Screen Share PiP */}
      <ScreenShareViewer
        stream={screenStream}
        presenterName={screenPresenterName}
        isPresenter={!!screenStream}
        onStartShare={onStartScreenShare}
        onStopShare={onStopScreenShare}
      />

      {/* Modals and Overlays */}
      <FacultySlideOver
        isOpen={isFacultySlideOverOpen}
        onClose={() => setIsFacultySlideOverOpen(false)}
        members={room.members}
        currentMember={currentMember}
        chatMuted={room.chatMuted}
        pinnedAnnouncement={room.pinnedAnnouncement}
        onToggleMute={onToggleMute}
        onPinAnnouncement={onPinAnnouncement}
        onBroadcastFile={handleBroadcastFile}
        onKickMember={onKickMember}
        onEndRoom={onEndRoom}
      />

      <QRModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        roomCode={room.code}
      />

      <RoomSwitcherModal
        isOpen={isRoomSwitcherOpen}
        onClose={() => setIsRoomSwitcherOpen(false)}
        currentRoomCode={room.code}
        activeRooms={activeRooms}
        onSwitchRoom={onSwitchRoom}
        onJoinNewRoom={onJoinNewRoom}
        onCreateNewRoom={onCreateNewRoom}
        onRemoveRoomFromHistory={onRemoveRoomFromHistory}
      />

      <HandRaiseModal
        isOpen={isHandQueueOpen}
        onClose={() => setIsHandQueueOpen(false)}
        handsRaised={room.handsRaised || []}
        isFaculty={!!isFacultyOrHost}
        onLowerHand={onLowerHand}
        onLowerAllHands={onLowerAllHands}
      />

      <PollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onCreatePoll={onCreatePoll}
      />

      <WhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
        strokes={room.whiteboardStrokes || []}
        onEmitStroke={onEmitWhiteboardStroke}
        onClearWhiteboard={onClearWhiteboard}
        onBroadcastImage={async (file: File) => {
          await onUploadFile(file, true);
        }}
        onEmitCursor={onEmitWhiteboardCursor}
        remoteCursors={remoteWhiteboardCursors}
      />

      <ClassroomTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        timerState={room.timerState}
        isFaculty={!!isFacultyOrHost}
        onUpdateTimer={onUpdateTimerState}
      />

      <QAQueueModal
        isOpen={isQAModalOpen}
        onClose={() => setIsQAModalOpen(false)}
        questions={room.qaQuestions || []}
        isFaculty={!!isFacultyOrHost}
        currentSocketId={currentMember?.socketId}
        onAskQuestion={onAskQAQuestion}
        onEditQuestion={onEditQAQuestion}
        onAnswerQuestion={onAnswerQAQuestion}
        onUpvoteQuestion={onUpvoteQAQuestion}
        onUpvoteAnswer={onUpvoteQAAnswer}
        onToggleAnswer={onToggleAnswerQA}
      />

      <SlidePresenterModal
        isOpen={isPresenterModalOpen}
        onClose={() => setIsPresenterModalOpen(false)}
        presenterState={room.presenterState}
        laserPos={laserPos}
        onSyncPresenter={onSyncPresenter}
        onEmitLaserMove={onEmitLaserMove}
        onAnnotateSlide={onAnnotateSlide}
        onClearSlideAnnotations={onClearSlideAnnotations}
        isFaculty={!!isFacultyOrHost}
      />

      <DeveloperDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      <ExportNotesModal
        isOpen={isExportNotesOpen}
        onClose={() => setIsExportNotesOpen(false)}
        room={room}
        currentMember={currentMember}
      />

      {/* Elevate to Faculty Passphrase Modal */}
      <Modal
        isOpen={isElevateModalOpen}
        onClose={() => {
          setIsElevateModalOpen(false);
          setElevatePassphrase('');
          setElevateError('');
        }}
        title="Unlock Faculty Controls"
      >
        <form onSubmit={handleElevateSubmit} className="space-y-4">
          <p className="text-footnote text-apple-textSecondary dark:text-white/60">
            Enter the institutional faculty passphrase to access moderation controls, chat mute, and announcement pinning.
          </p>

          <div className="space-y-1">
            <input
              type="password"
              value={elevatePassphrase}
              onChange={(e) => setElevatePassphrase(e.target.value)}
              placeholder="Enter faculty passphrase"
              className="w-full px-4 py-3 bg-apple-secondaryBg dark:bg-white/10 rounded-ios-input text-body text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/50 outline-none focus:ring-2 focus:ring-apple-blue"
              autoFocus
            />
            {elevateError && (
              <p className="text-caption text-apple-red font-medium">{elevateError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsElevateModalOpen(false)}
              className="px-4 py-2 rounded-ios-btn text-footnote font-medium text-apple-textSecondary hover:bg-apple-secondaryBg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-ios-btn bg-apple-blue hover:bg-apple-blueHover text-white font-medium text-footnote shadow-sm"
            >
              Unlock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
