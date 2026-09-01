import React, { useState, useEffect } from 'react';
import { formatRoomCode, cleanRoomCode } from '../../utils/format.js';
import { DisplayNameModal } from './DisplayNameModal.js';
import { DeveloperDocsModal } from '../docs/DeveloperDocsModal.js';
import { BrandLogo } from '../common/BrandLogo.js';
import {
  ArrowRight,
  Plus,
  Zap,
  Lock,
  Sparkles,
  Moon,
  Sun,
  Star,
  BookOpen,
  PenTool,
  Presentation,
  Code2,
  HelpCircle,
  BarChart2,
  Cpu,
  Heart
} from 'lucide-react';

interface HomePageProps {
  onCreateRoom: (displayName: string, isFaculty: boolean, passphrase?: string) => Promise<void>;
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

  const handleModalSubmit = async (displayName: string, isFaculty: boolean, passphrase?: string) => {
    if (modalMode === 'create') {
      await onCreateRoom(displayName, isFaculty, passphrase);
    } else if (modalMode === 'join') {
      await onJoinRoom(cleanRoomCode(codeInput), displayName, isFaculty, passphrase);
    }
    setModalMode(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 selection:bg-apple-blue selection:text-white">
      {/* Top Brand & Navigation Bar */}
      <header className="flex items-center justify-between pb-6 border-b border-apple-border/40 dark:border-white/10">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" />
          <div>
            <span className="font-bold text-title-2 tracking-tight text-apple-textPrimary dark:text-white block leading-none">
              iChatWorld
            </span>
            <span className="text-[11px] font-medium text-apple-textSecondary dark:text-white/50 tracking-wide uppercase">
              Classroom & Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Docs Modal Button */}
          <button
            onClick={() => setShowDocsModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-footnote font-semibold text-apple-textSecondary dark:text-white/80 hover:text-apple-textPrimary dark:hover:text-white bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 transition-all active:scale-95"
            title="Open Platform & Developer Docs"
          >
            <BookOpen className="w-3.5 h-3.5 text-apple-blue" />
            <span>Docs</span>
          </button>

          {/* Star on GitHub CTA */}
          <a
            href="https://github.com/pwnjoshi/iChatWorld"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-yellow-50 dark:hover:bg-yellow-950/40 text-apple-textPrimary dark:text-white border border-apple-border/50 dark:border-white/10 text-footnote font-semibold transition-all active:scale-95 shadow-2xs"
            title="Star iChatWorld on GitHub"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="hidden sm:inline">Star on GitHub</span>
            <span className="sm:hidden">Star</span>
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

      {/* Main Studio Grid Area (2-Column on Desktop) */}
      <main className="my-auto py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero & Action Card */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3 text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-apple-textPrimary dark:text-white leading-[1.15]">
                Connect instantly.<br />
                <span className="text-apple-blue font-semibold">
                  No login. Just a code.
                </span>
              </h1>
              <p className="text-subhead text-apple-textSecondary dark:text-white/70 max-w-lg leading-relaxed">
                Zero-login real-time classroom chat, WebRTC direct gigabit file sharing, AI teaching assistant, and synchronized whiteboard studio.
              </p>
            </div>

            {/* Primary Action Card */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 sm:p-8 shadow-xl border border-apple-border/70 dark:border-white/10 space-y-5">
              {/* Start a Room Button */}
              <div>
                <button
                  onClick={() => setModalMode('create')}
                  className="w-full py-4 px-6 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white font-bold text-headline shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 group active:scale-[0.99]"
                >
                  <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span>Start a New Room</span>
                </button>
              </div>

              {/* Improved Centered Divider with Lines on Left & Right */}
              <div className="relative flex items-center justify-center my-4">
                <div className="flex-grow border-t border-apple-border/70 dark:border-white/10" />
                <span className="shrink-0 px-4 text-caption font-semibold uppercase tracking-wider text-apple-textSecondary dark:text-white/50">
                  or join existing
                </span>
                <div className="flex-grow border-t border-apple-border/70 dark:border-white/10" />
              </div>

              {/* Join Code Input Form */}
              <form onSubmit={handleJoinClick} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-footnote font-medium text-apple-textSecondary dark:text-white/70 text-center">
                    Enter 6-Character Room Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={handleCodeChange}
                      placeholder="e.g. 482-901"
                      maxLength={7}
                      className="flex-1 px-4 py-3.5 bg-apple-secondaryBg dark:bg-white/10 rounded-2xl text-headline font-mono font-bold tracking-widest text-center text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/40 dark:placeholder:text-white/30 outline-none border border-apple-border/40 dark:border-white/10 focus:ring-2 focus:ring-apple-blue transition-all uppercase"
                    />
                    <button
                      type="submit"
                      disabled={cleanRoomCode(codeInput).length !== 6}
                      className="px-6 py-3.5 rounded-2xl bg-apple-blue hover:bg-apple-blueHover disabled:opacity-30 disabled:hover:bg-apple-blue text-white font-semibold text-subhead transition-all flex items-center justify-center shrink-0 active:scale-[0.98] shadow-sm"
                    >
                      <span>Join</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </button>
                  </div>
                </div>

                {joinError && (
                  <p className="text-footnote text-apple-red font-medium text-center">
                    {joinError}
                  </p>
                )}
              </form>
            </div>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white/70 dark:bg-white/5 rounded-2xl border border-apple-border/40 dark:border-white/10 shadow-2xs">
                <Zap className="w-4 h-4 text-apple-blue mx-auto mb-1" />
                <p className="text-caption font-bold text-apple-textPrimary dark:text-white">Instant P2P</p>
                <p className="text-[11px] text-apple-textSecondary dark:text-white/50">Direct Wi-Fi speeds</p>
              </div>
              <div className="p-3 bg-white/70 dark:bg-white/5 rounded-2xl border border-apple-border/40 dark:border-white/10 shadow-2xs">
                <Lock className="w-4 h-4 text-apple-green mx-auto mb-1" />
                <p className="text-caption font-bold text-apple-textPrimary dark:text-white">Zero Login</p>
                <p className="text-[11px] text-apple-textSecondary dark:text-white/50">No emails or accounts</p>
              </div>
              <div className="p-3 bg-white/70 dark:bg-white/5 rounded-2xl border border-apple-border/40 dark:border-white/10 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-caption font-bold text-apple-textPrimary dark:text-white">Self-Destructs</p>
                <p className="text-[11px] text-apple-textSecondary dark:text-white/50">Auto-purged</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Studio Feature Explorer (Desktop Showcase) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur border border-apple-border/70 dark:border-white/10 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-apple-border/40 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-apple-blue" />
                  <h3 className="text-headline font-bold text-apple-textPrimary dark:text-white">
                    Integrated Classroom Suite
                  </h3>
                </div>
                <button
                  onClick={() => setShowDocsModal(true)}
                  className="text-caption font-bold text-apple-blue hover:underline flex items-center gap-1"
                >
                  <span>Explore All Docs</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Feature 1 */}
                <div className="p-3.5 rounded-2xl bg-apple-secondaryBg/70 dark:bg-white/5 border border-apple-border/40 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-footnote">
                    <Sparkles className="w-4 h-4" />
                    <span>In-Room @ai Assistant</span>
                  </div>
                  <p className="text-caption text-apple-textSecondary dark:text-white/60">
                    Type <code className="text-xs font-mono px-1 py-0.5 bg-black/10 dark:bg-white/10 rounded">@ai &lt;question&gt;</code> in chat for instant peer tutoring & code explanations.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="p-3.5 rounded-2xl bg-apple-secondaryBg/70 dark:bg-white/5 border border-apple-border/40 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-apple-blue font-bold text-footnote">
                    <PenTool className="w-4 h-4" />
                    <span>Whiteboard Studio</span>
                  </div>
                  <p className="text-caption text-apple-textSecondary dark:text-white/60">
                    Smooth Bézier pressure drawing with 0 spikes, Obsidian dark mode, and paper grid themes.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="p-3.5 rounded-2xl bg-apple-secondaryBg/70 dark:bg-white/5 border border-apple-border/40 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-footnote">
                    <Presentation className="w-4 h-4" />
                    <span>Slide Presenter & Laser</span>
                  </div>
                  <p className="text-caption text-apple-textSecondary dark:text-white/60">
                    Synchronized slides with live pen, highlighter, slide deletion, and red laser pointer tracking.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="p-3.5 rounded-2xl bg-apple-secondaryBg/70 dark:bg-white/5 border border-apple-border/40 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-footnote">
                    <Code2 className="w-4 h-4" />
                    <span>Interactive CodePad</span>
                  </div>
                  <p className="text-caption text-apple-textSecondary dark:text-white/60">
                    Live multi-language code runner and syntax highlighter with 1-tap broadcast to chat.
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="p-3.5 rounded-2xl bg-apple-secondaryBg/70 dark:bg-white/5 border border-apple-border/40 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-footnote">
                    <BarChart2 className="w-4 h-4" />
                    <span>Live Polls & 1-Tap Delete</span>
                  </div>
                  <p className="text-caption text-apple-textSecondary dark:text-white/60">
                    Real-time aggregated classroom voting with instant creator/faculty deletion.
                  </p>
                </div>

                {/* Feature 6 */}
                <div className="p-3.5 rounded-2xl bg-apple-secondaryBg/70 dark:bg-white/5 border border-apple-border/40 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-footnote">
                    <HelpCircle className="w-4 h-4" />
                    <span>Anonymous Q&A Queue</span>
                  </div>
                  <p className="text-caption text-apple-textSecondary dark:text-white/60">
                    Student question queue with upvoting and instructor answer threads.
                  </p>
                </div>
              </div>

              {/* GitHub Banner Callout */}
              <div className="p-4 rounded-2xl bg-apple-secondaryBg dark:bg-white/5 border border-apple-border/70 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-apple-textPrimary dark:text-white flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    <span>Love iChatWorld?</span>
                  </span>
                  <p className="text-[12px] text-apple-textSecondary dark:text-white/70">
                    Star on GitHub or fork the repo to contribute new studio features!
                  </p>
                </div>
                <a
                  href="https://github.com/pwnjoshi/iChatWorld"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white text-caption font-semibold transition-all shadow-sm shrink-0 flex items-center gap-1.5 active:scale-95"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>Star</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-6 border-t border-apple-border/40 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-caption text-apple-textSecondary dark:text-white/50">
        <p>Built with ❤️ for modern classrooms • No server storage • 100% Ephemeral</p>
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
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
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
