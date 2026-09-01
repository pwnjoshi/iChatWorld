import React, { useState } from 'react';
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
import { CodePadModal } from './CodePadModal.js';
import { ClassroomTimerModal } from './ClassroomTimer.js';
import { QAQueueModal } from './QAQueueModal.js';
import { SlidePresenterModal } from './SlidePresenterModal.js';
import { AISummaryModal } from './AISummaryModal.js';
import { ScreenShareViewer } from './ScreenShareViewer.js';
import { Modal } from '../common/Modal.js';
import { MessageSquare, Folder, Shield } from 'lucide-react';
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
  onGetAISummary: () => Promise<any>;
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
  onGetAISummary,
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
  const [isCodePadOpen, setIsCodePadOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isQAModalOpen, setIsQAModalOpen] = useState(false);
  const [isPresenterModalOpen, setIsPresenterModalOpen] = useState(false);
  const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);
  const [isElevateModalOpen, setIsElevateModalOpen] = useState(false);
  const [elevatePassphrase, setElevatePassphrase] = useState('');
  const [elevateError, setElevateError] = useState('');

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
      setIsFacultySlideOverOpen(true);
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
    <div className="flex flex-col h-screen max-w-[600px] mx-auto bg-apple-bg dark:bg-black border-x border-apple-border/50 dark:border-white/10 shadow-sm selection:bg-apple-blue selection:text-white transition-colors">
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
        onOpenCodePad={() => setIsCodePadOpen(true)}
        onOpenTimerModal={() => setIsTimerModalOpen(true)}
        onOpenQAModal={() => setIsQAModalOpen(true)}
        onOpenPresenter={() => setIsPresenterModalOpen(true)}
        onOpenAISummary={() => setIsAISummaryOpen(true)}
        onStartScreenShare={onStartScreenShare}
        onToggleRaiseHand={handleToggleRaiseHand}
        onLeaveRoom={onLeaveRoom}
        onEndRoom={onEndRoom}
        onElevatePrompt={() => setIsElevateModalOpen(true)}
      />

      {/* Segmented Chat / Files Switcher Bar */}
      <div className="px-4 py-2 bg-white/50 dark:bg-black/50 backdrop-blur border-b border-apple-border/40 dark:border-white/10 shrink-0">
        <div className="flex p-0.5 bg-apple-secondaryBg dark:bg-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-footnote font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-[#1C1C1E] text-apple-textPrimary dark:text-white shadow-sm'
                : 'text-apple-textSecondary dark:text-white/60 hover:text-apple-textPrimary dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat ({room.messages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-footnote font-semibold transition-all ${
              activeTab === 'files'
                ? 'bg-white dark:bg-[#1C1C1E] text-apple-textPrimary dark:text-white shadow-sm'
                : 'text-apple-textSecondary dark:text-white/60 hover:text-apple-textPrimary dark:hover:text-white'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Files ({room.files.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
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
            currentMember={currentMember}
            transfers={transfers}
            downloadedBlobs={downloadedBlobs}
            onUploadFile={onUploadFile}
            onDownloadFile={onDownloadFile}
            onDeleteFile={onDeleteFile}
            onShareInChat={handleShareFileInChat}
          />
        )}
      </main>

      {/* Screen Share Floating Viewer */}
      <ScreenShareViewer
        stream={screenStream}
        presenterName={screenPresenterName}
        isPresenter={!!screenStream}
        onStartShare={onStartScreenShare}
        onStopShare={onStopScreenShare}
      />

      {/* Collaborative Whiteboard */}
      <WhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
        strokes={room.whiteboardStrokes || []}
        onEmitStroke={onEmitWhiteboardStroke}
        onClearWhiteboard={onClearWhiteboard}
        onBroadcastImage={handleBroadcastFile}
      />

      {/* Interactive Code Pad & Runner */}
      <CodePadModal
        isOpen={isCodePadOpen}
        onClose={() => setIsCodePadOpen(false)}
        onShareToChat={handleShareCodeToChat}
      />

      {/* Classroom Timer Modal */}
      <ClassroomTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        timerState={room.timerState}
        onUpdateTimer={onUpdateTimerState}
        isFaculty={!!isFacultyOrHost}
      />

      {/* Anonymous Q&A Modal */}
      <QAQueueModal
        isOpen={isQAModalOpen}
        onClose={() => setIsQAModalOpen(false)}
        questions={room.qaQuestions || []}
        currentSocketId={currentMember?.socketId}
        isFaculty={!!isFacultyOrHost}
        onAskQuestion={onAskQAQuestion}
        onEditQuestion={onEditQAQuestion}
        onAnswerQuestion={onAnswerQAQuestion}
        onUpvoteQuestion={onUpvoteQAQuestion}
        onUpvoteAnswer={onUpvoteQAAnswer}
        onToggleAnswer={onToggleAnswerQA}
      />

      {/* Synchronized Slide Presenter */}
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

      {/* AI Summary Modal */}
      <AISummaryModal
        isOpen={isAISummaryOpen}
        onClose={() => setIsAISummaryOpen(false)}
        onGetSummary={onGetAISummary}
      />

      {/* Room Switcher Modal */}
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

      {/* Raised Hands Modal */}
      <HandRaiseModal
        isOpen={isHandQueueOpen}
        onClose={() => setIsHandQueueOpen(false)}
        handsRaised={room.handsRaised || []}
        onLowerHand={onLowerHand}
        onLowerAllHands={onLowerAllHands}
        isFaculty={!!isFacultyOrHost}
      />

      {/* Poll Creation Modal */}
      <PollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onCreatePoll={onCreatePoll}
      />

      {/* QR Modal */}
      <QRModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        roomCode={room.code}
      />

      {/* Faculty Slide-over */}
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

      {/* Faculty Elevation Modal */}
      <Modal
        isOpen={isElevateModalOpen}
        onClose={() => setIsElevateModalOpen(false)}
        title="Faculty Access"
      >
        <form onSubmit={handleElevateSubmit} className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-footnote">
            <Shield className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Enter the institutional passphrase to unlock moderation tools.</span>
          </div>

          <div>
            <label className="block text-caption font-medium text-apple-textSecondary mb-1.5">
              Passphrase
            </label>
            <input
              type="password"
              value={elevatePassphrase}
              onChange={(e) => {
                setElevatePassphrase(e.target.value);
                setElevateError('');
              }}
              placeholder="Passphrase (default: faculty123)"
              autoFocus
              className="w-full px-3.5 py-2.5 bg-apple-secondaryBg dark:bg-white/10 rounded-ios-input text-body text-apple-textPrimary dark:text-white outline-none focus:ring-2 focus:ring-apple-blue transition-all"
            />
          </div>

          {elevateError && (
            <p className="text-footnote text-apple-red font-medium">
              {elevateError}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsElevateModalOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-full bg-apple-secondaryBg dark:bg-white/10 text-apple-textPrimary dark:text-white text-footnote font-medium hover:bg-apple-tertiaryBg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-full bg-apple-blue text-white text-footnote font-semibold hover:bg-apple-blueHover transition-colors shadow-sm"
            >
              Unlock Controls
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
