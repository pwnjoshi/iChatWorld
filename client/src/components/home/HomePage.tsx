import React, { useState, useEffect } from 'react';
import { formatRoomCode, cleanRoomCode } from '../../utils/format.js';
import { DisplayNameModal } from './DisplayNameModal.js';
import { DeveloperDocsModal } from '../docs/DeveloperDocsModal.js';
import { BrandLogo } from '../common/BrandLogo.js';
import {
  ArrowRight,
  Plus,
  Moon,
  Sun,
  Star,
  BookOpen,
  MessageSquare,
  Folder,
  PenTool,
  Presentation,
  Mail,
  HelpCircle,
  BarChart2,
  ShieldCheck
} from 'lucide-react';

interface HomePageProps {
  onCreateRoom: (displayName: string, isFaculty: boolean, passphrase?: string, lifespanHours?: number) => Promise<void>;
  onJoinRoom: (code: string, displayName: string, isFaculty: boolean, passphrase?: string) => Promise<void>;
  initialCode?: string;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onCreateRoom,
  onJoinRoom,
  initialCode = '',
  isDarkMode = false,
  onToggleDarkMode
}) => {
  const [codeInput, setCodeInput] = useState(initialCode ? formatRoomCode(initialCode) : '');
  const [modalMode, setModalMode] = useState<'create' | 'join' | null>(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (initialCode) {
      setCodeInput(formatRoomCode(initialCode));
      setModalMode('join');
    }
  }, [initialCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRoomCode(e.target.value);
    setCodeInput(formatted);
    setJoinError('');
  };

  const handleJoinClick = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanRoomCode(codeInput);
    if (clean.length !== 6) {
      setJoinError('Please enter a valid 6-character room code');
      return;
    }
    setModalMode('join');
  };

  const handleModalSubmit = async (displayName: string, isFaculty: boolean, passphrase?: string, lifespanHours?: number) => {
    if (modalMode === 'create') {
      await onCreateRoom(displayName, isFaculty, passphrase, lifespanHours);
    } else if (modalMode === 'join') {
      await onJoinRoom(cleanRoomCode(codeInput), displayName, isFaculty, passphrase);
    }
    setModalMode(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 selection:bg-apple-blue selection:text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-5 border-b border-apple-border/50 dark:border-white/10">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" />
          <div>
            <span className="font-bold text-headline tracking-tight text-apple-textPrimary dark:text-white block leading-none">
              iChatWorld
            </span>
            <span className="text-[11px] text-apple-textSecondary dark:text-white/50 tracking-wide font-medium">
              Disposable Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Docs Modal Button */}
          <button
            onClick={() => setShowDocsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-footnote font-medium text-apple-textSecondary dark:text-white/80 hover:text-apple-textPrimary dark:hover:text-white bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 transition-all"
            title="Open Platform & Developer Docs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Docs</span>
          </button>

          {/* Star on GitHub */}
          <a
            href="https://github.com/pwnjoshi/iChatWorld"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg text-apple-textPrimary dark:text-white border border-apple-border/50 dark:border-white/10 text-footnote font-medium transition-all"
            title="Star iChatWorld on GitHub"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="hidden sm:inline">Star</span>
          </a>

          {/* Dark Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-full text-apple-textSecondary dark:text-white/80 hover:text-apple-textPrimary dark:hover:text-white bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Area */}
      <main className="my-auto py-8 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading & Room Action Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-apple-textPrimary dark:text-white leading-tight">
                Disposable rooms for real-time collaboration.
              </h1>
              <p className="text-subhead text-apple-textSecondary dark:text-white/70 max-w-xl leading-relaxed">
                Create a room in one tap or join with a 6-character code. Live chat, peer-to-peer file drops, synchronized whiteboard, and presentation tools for teams, study groups, labs, and workshops. All room data is ephemeral and self-destructs when you leave.
              </p>
            </div>

            {/* Action Card */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 sm:p-7 shadow-sm border border-apple-border/70 dark:border-white/10 space-y-5 max-w-lg">
              {/* Start a Room Button */}
              <div>
                <button
                  onClick={() => setModalMode('create')}
                  className="w-full py-3.5 px-6 rounded-xl bg-apple-blue hover:bg-apple-blueHover text-white font-semibold text-body transition-all flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start a New Room</span>
                </button>
              </div>

              {/* Symmetric Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="flex-grow border-t border-apple-border/70 dark:border-white/10" />
                <span className="shrink-0 px-3 text-caption uppercase tracking-wider text-apple-textSecondary dark:text-white/40 font-medium">
                  or enter room code
                </span>
                <div className="flex-grow border-t border-apple-border/70 dark:border-white/10" />
              </div>

              {/* Join Form */}
              <form onSubmit={handleJoinClick} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={handleCodeChange}
                    placeholder="e.g. 482-901"
                    maxLength={7}
                    className="flex-1 px-4 py-3 bg-apple-secondaryBg dark:bg-white/10 rounded-xl text-body font-mono font-bold tracking-widest text-center text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/40 dark:placeholder:text-white/30 outline-none border border-apple-border/40 dark:border-white/10 focus:border-apple-blue transition-all uppercase"
                  />
                  <button
                    type="submit"
                    disabled={cleanRoomCode(codeInput).length !== 6}
                    className="px-5 py-3 rounded-xl bg-apple-blue hover:bg-apple-blueHover disabled:opacity-30 text-white font-semibold text-footnote transition-all flex items-center justify-center shrink-0 active:scale-[0.98]"
                  >
                    <span>Join</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>

                {joinError && (
                  <p className="text-caption text-apple-red font-medium text-center">
                    {joinError}
                  </p>
                )}
              </form>
            </div>

            {/* Privacy note */}
            <div className="flex items-center gap-2 text-caption text-apple-textSecondary dark:text-white/50">
              <ShieldCheck className="w-4 h-4 text-apple-green shrink-0" />
              <span>Zero accounts, no tracking cookies, and zero server file retention.</span>
            </div>
          </div>

          {/* Right Column: Live Studio Preview Panel */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-apple-border/70 dark:border-white/10 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-apple-border/40 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-apple-green" />
                  <span className="text-footnote font-semibold text-apple-textPrimary dark:text-white">
                    Room Workspace Preview
                  </span>
                </div>
                <span className="text-[11px] font-mono text-apple-textSecondary dark:text-white/50">
                  CODE: 729-415
                </span>
              </div>

              {/* Tool Capabilities Preview */}
              <div className="space-y-2 text-footnote">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-apple-secondaryBg/70 dark:bg-white/5">
                  <MessageSquare className="w-4 h-4 text-apple-blue shrink-0" />
                  <div>
                    <p className="font-semibold text-apple-textPrimary dark:text-white leading-tight">Live Ephemeral Chat</p>
                    <p className="text-caption text-apple-textSecondary dark:text-white/60">Voice notes, code snippets, reactions, and in-room @ai assistance.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-apple-secondaryBg/70 dark:bg-white/5">
                  <Folder className="w-4 h-4 text-apple-blue shrink-0" />
                  <div>
                    <p className="font-semibold text-apple-textPrimary dark:text-white leading-tight">P2P File Transfers</p>
                    <p className="text-caption text-apple-textSecondary dark:text-white/60">Direct WebRTC gigabit mesh streaming without server disk storage.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-apple-secondaryBg/70 dark:bg-white/5">
                  <PenTool className="w-4 h-4 text-apple-blue shrink-0" />
                  <div>
                    <p className="font-semibold text-apple-textPrimary dark:text-white leading-tight">Collaborative Whiteboard</p>
                    <p className="text-caption text-apple-textSecondary dark:text-white/60">Bézier pressure strokes, math grid paper, and PNG exports.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-apple-secondaryBg/70 dark:bg-white/5">
                  <Presentation className="w-4 h-4 text-apple-blue shrink-0" />
                  <div>
                    <p className="font-semibold text-apple-textPrimary dark:text-white leading-tight">Slide Presenter & Laser</p>
                    <p className="text-caption text-apple-textSecondary dark:text-white/60">Synchronized slides with live drawing annotations and laser pointer.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-apple-secondaryBg/70 dark:bg-white/5">
                  <Mail className="w-4 h-4 text-apple-blue shrink-0" />
                  <div>
                    <p className="font-semibold text-apple-textPrimary dark:text-white leading-tight">Export Notes & Homework</p>
                    <p className="text-caption text-apple-textSecondary dark:text-white/60">6-digit OTP verified delivery with whiteboard PNGs & assignments.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-5 border-t border-apple-border/40 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-caption text-apple-textSecondary dark:text-white/50">
        <p>iChatWorld — Ephemeral peer-to-peer workspace • Open source under MIT</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDocsModal(true)}
            className="hover:text-apple-blue transition-colors font-medium"
          >
            Developer Docs
          </button>
          <a
            href="https://github.com/pwnjoshi/iChatWorld"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-apple-blue transition-colors font-medium flex items-center gap-1"
          >
            <span>GitHub</span>
            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
          </a>
        </div>
      </footer>

      {/* Display Name Modal */}
      <DisplayNameModal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        onSubmit={handleModalSubmit}
        title={modalMode === 'create' ? 'Start a New Room' : `Join Room ${codeInput}`}
        actionText={modalMode === 'join' ? 'Enter Room' : 'Start Room'}
      />

      {/* Developer Docs Modal */}
      <DeveloperDocsModal
        isOpen={showDocsModal}
        onClose={() => setShowDocsModal(false)}
      />
    </div>
  );
};
