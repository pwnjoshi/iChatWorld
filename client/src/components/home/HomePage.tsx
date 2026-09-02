import React, { useState, useEffect } from 'react';
import { formatRoomCode, cleanRoomCode } from '../../utils/format.js';
import { DisplayNameModal } from './DisplayNameModal.js';
import { DeveloperDocsModal } from '../docs/DeveloperDocsModal.js';
import { BrandLogo } from '../common/BrandLogo.js';
import {
  MessageSquare,
  Folder,
  PenTool,
  Presentation,
  Mail,
  Sun,
  Moon,
  Star,
  ArrowRight,
  Plus,
  BookOpen,
  ShieldCheck,
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
  isDarkMode,
  onToggleDarkMode
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'join' | null>(null);
  const [joinError, setJoinError] = useState('');
  const [showDocsModal, setShowDocsModal] = useState(false);

  useEffect(() => {
    if (initialCode) {
      const formatted = formatRoomCode(initialCode);
      setCodeInput(formatted);
      if (cleanRoomCode(initialCode).length === 6) {
        setModalMode('join');
      }
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
    <div className="min-h-screen bg-apple-primaryBg dark:bg-black text-apple-textPrimary dark:text-white flex flex-col justify-between p-3.5 sm:p-6 md:p-8 transition-colors">
      {/* Top Header */}
      <header className="flex items-center justify-between py-2 border-b border-apple-border/40 dark:border-white/10 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <BrandLogo size="md" />
          <div>
            <h2 className="text-body font-bold tracking-tight text-apple-textPrimary dark:text-white leading-tight">
              iChatWorld
            </h2>
            <p className="text-[11px] text-apple-textSecondary dark:text-white/50 hidden sm:block">
              Ephemeral Collaboration Space
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Docs Modal Button */}
          <button
            onClick={() => setShowDocsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-footnote font-semibold text-apple-textSecondary dark:text-white/80 hover:text-apple-textPrimary dark:hover:text-white bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 transition-all active:scale-95"
            title="Open Platform & Developer Docs"
          >
            <BookOpen className="w-3.5 h-3.5 text-apple-blue" />
            <span className="text-xs sm:text-footnote">Docs</span>
          </button>

          {/* Star on GitHub */}
          <a
            href="https://github.com/pwnjoshi/iChatWorld"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 text-apple-textPrimary dark:text-white border border-apple-border/50 dark:border-white/10 text-footnote font-semibold transition-all active:scale-95"
            title="Star iChatWorld on GitHub"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="hidden sm:inline">Star</span>
          </a>

          {/* Dark Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-full text-apple-textSecondary dark:text-white/80 hover:text-apple-textPrimary dark:hover:text-white bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 transition-colors active:scale-95"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Hero & Action Section */}
      <main className="my-auto py-5 sm:py-8 md:py-12 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
          {/* Left Column: Heading & Room Action Card */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            <div className="space-y-2.5 sm:space-y-3">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-apple-textPrimary dark:text-white leading-tight">
                Disposable rooms for real-time collaboration.
              </h1>
              <p className="text-footnote sm:text-subhead text-apple-textSecondary dark:text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Instant encrypted workspaces with live chat, WebRTC file drops, collaborative whiteboard, and synchronized presentation decks. No history retained.
              </p>
            </div>

            {/* Action Card */}
            <div className="bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl rounded-3xl p-4 sm:p-7 shadow-ios-card border border-apple-border/70 dark:border-white/10 space-y-4 max-w-md mx-auto lg:mx-0">
              {/* ── Clean Apple-style "Start a Room" Button ── */}
              <button
                onClick={() => setModalMode('create')}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-body transition-all flex items-center justify-center gap-2 active:scale-[0.98] select-none text-white bg-apple-blue hover:bg-apple-blueHover shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Start a New Room</span>
              </button>

              {/* Symmetric Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="flex-grow border-t border-apple-border/70 dark:border-white/10" />
                <span className="shrink-0 px-3 text-[10px] font-bold uppercase tracking-widest text-apple-textSecondary/60 dark:text-white/40">
                  or enter room code
                </span>
                <div className="flex-grow border-t border-apple-border/70 dark:border-white/10" />
              </div>

              {/* Join Form — fixed overflow with min-w-0 and overflow-hidden */}
              <form onSubmit={handleJoinClick} className="space-y-2">
                <div className="flex items-center gap-1.5 p-1.5 bg-apple-secondaryBg dark:bg-white/10 rounded-2xl border border-apple-border/50 dark:border-white/10 focus-within:ring-2 focus-within:ring-apple-blue transition-all overflow-hidden">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={handleCodeChange}
                    placeholder="E.G. 482-901"
                    maxLength={7}
                    className="min-w-0 flex-1 bg-transparent pl-2 pr-1 py-2 text-center text-body font-mono font-bold tracking-widest text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/40 dark:placeholder:text-white/30 outline-none uppercase"
                  />
                  {/* ── Clean Apple-style "Join" Button ── */}
                  <button
                    type="submit"
                    disabled={cleanRoomCode(codeInput).length !== 6}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-footnote transition-all select-none text-white bg-apple-blue hover:bg-apple-blueHover shadow-sm active:scale-95 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    <span>Join</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {joinError && (
                  <p className="text-caption text-apple-red font-medium text-center pt-1">
                    {joinError}
                  </p>
                )}
              </form>

              {/* Privacy note */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-apple-textSecondary dark:text-white/50 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-apple-green shrink-0" />
                <span>Zero accounts, no tracking cookies, zero server logs.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Studio Capabilities (Desktop Preview / Mobile 2x2 Grid) */}
          <div className="lg:col-span-5">
            {/* Desktop Full Workspace Preview Card */}
            <div className="hidden lg:block bg-white dark:bg-[#1C1C1E] rounded-3xl border border-apple-border/70 dark:border-white/10 shadow-ios-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-apple-border/40 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-apple-green animate-pulse" />
                  <span className="text-footnote font-bold text-apple-textPrimary dark:text-white">
                    Room Workspace Preview
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-apple-textSecondary dark:text-white/50">
                  CODE: 729-415
                </span>
              </div>

              {/* Tool Capabilities Preview */}
              <div className="space-y-2 text-footnote">
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-apple-secondaryBg/70 dark:bg-white/5">
                  <MessageSquare className="w-4 h-4 text-apple-blue shrink-0" />
                  <div>
                    <p className="font-bold text-apple-textPrimary dark:text-white leading-tight">Live Ephemeral Chat</p>
                    <p className="text-caption text-apple-textSecondary dark:text-white/60">Voice notes, code snippets, reactions, and in-room @ai assistance.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-apple-secondaryBg/70 dark:bg-white/5">
                  <Folder className="w-4 h-4 text-apple-blue shrink-0" />
                  <div>
                    <p className="font-bold text-apple-textPrimary dark:text-white leading-tight">P2P File Transfers</p>
                    <p className="text-caption text-apple-textSecondary dark:text-white/60">Direct WebRTC gigabit mesh streaming without server disk storage.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-apple-secondaryBg/70 dark:bg-white/5">
                  <PenTool className="w-4 h-4 text-apple-blue shrink-0" />
                  <div>
                    <p className="font-bold text-apple-textPrimary dark:text-white leading-tight">Collaborative Whiteboard</p>
                    <p className="text-caption text-apple-textSecondary dark:text-white/60">Multi-pen dock, pressure curves, multi-erasers, and text notes.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-apple-secondaryBg/70 dark:bg-white/5">
                  <Presentation className="w-4 h-4 text-apple-blue shrink-0" />
                  <div>
                    <p className="font-bold text-apple-textPrimary dark:text-white leading-tight">Slide Presenter & Laser</p>
                    <p className="text-caption text-apple-textSecondary dark:text-white/60">Synchronized slides with live drawing annotations and laser pointer.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-apple-secondaryBg/70 dark:bg-white/5">
                  <Mail className="w-4 h-4 text-apple-blue shrink-0" />
                  <div>
                    <p className="font-bold text-apple-textPrimary dark:text-white leading-tight">Export Notes & Homework</p>
                    <p className="text-caption text-apple-textSecondary dark:text-white/60">6-digit OTP verified delivery with whiteboard PNGs & assignments.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Native 2x2 Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5 lg:hidden pt-2">
              <div className="p-3 bg-white/70 dark:bg-white/5 backdrop-blur rounded-2xl border border-apple-border/60 dark:border-white/10 space-y-1">
                <MessageSquare className="w-4 h-4 text-apple-blue" />
                <p className="text-caption font-bold text-apple-textPrimary dark:text-white">Live Chat & AI</p>
                <p className="text-[10px] text-apple-textSecondary dark:text-white/50">Voice notes & @ai helper</p>
              </div>

              <div className="p-3 bg-white/70 dark:bg-white/5 backdrop-blur rounded-2xl border border-apple-border/60 dark:border-white/10 space-y-1">
                <Folder className="w-4 h-4 text-emerald-500" />
                <p className="text-caption font-bold text-apple-textPrimary dark:text-white">P2P File Drop</p>
                <p className="text-[10px] text-apple-textSecondary dark:text-white/50">Direct gigabit mesh</p>
              </div>

              <div className="p-3 bg-white/70 dark:bg-white/5 backdrop-blur rounded-2xl border border-apple-border/60 dark:border-white/10 space-y-1">
                <PenTool className="w-4 h-4 text-purple-500" />
                <p className="text-caption font-bold text-apple-textPrimary dark:text-white">Whiteboard</p>
                <p className="text-[10px] text-apple-textSecondary dark:text-white/50">Multi-pen studio</p>
              </div>

              <div className="p-3 bg-white/70 dark:bg-white/5 backdrop-blur rounded-2xl border border-apple-border/60 dark:border-white/10 space-y-1">
                <Mail className="w-4 h-4 text-amber-500" />
                <p className="text-caption font-bold text-apple-textPrimary dark:text-white">Export Notes</p>
                <p className="text-[10px] text-apple-textSecondary dark:text-white/50">6-digit OTP delivery</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-4 border-t border-apple-border/40 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-apple-textSecondary dark:text-white/50 max-w-6xl mx-auto w-full pb-safe">
        <p>iChatWorld — Ephemeral peer-to-peer workspace • Open source under MIT</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDocsModal(true)}
            className="hover:text-apple-blue transition-colors font-semibold"
          >
            Developer Docs
          </button>
          <a
            href="https://github.com/pwnjoshi/iChatWorld"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-apple-blue transition-colors font-semibold flex items-center gap-1"
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
