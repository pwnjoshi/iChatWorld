import React, { useState, useEffect } from 'react';
import { formatRoomCode, cleanRoomCode } from '../../utils/format.js';
import { DisplayNameModal } from './DisplayNameModal.js';
import { ArrowRight, Plus, Shield, Zap, Lock, Sparkles, Moon, Sun } from 'lucide-react';

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
  const [modalMode, setModalMode] = useState<'create' | 'join' | 'faculty' | null>(null);
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
    if (modalMode === 'create' || modalMode === 'faculty') {
      await onCreateRoom(displayName, isFaculty, passphrase);
    } else if (modalMode === 'join') {
      await onJoinRoom(cleanRoomCode(codeInput), displayName, isFaculty, passphrase);
    }
    setModalMode(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-[560px] mx-auto px-5 py-8 md:py-16 selection:bg-apple-blue selection:text-white">
      {/* Top Brand Bar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-apple-blue flex items-center justify-center text-white shadow-sm font-bold text-base tracking-tight">
            iC
          </div>
          <span className="font-semibold text-headline tracking-tight text-apple-textPrimary dark:text-white">
            iChatWorld
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-full text-apple-textSecondary dark:text-white/80 hover:text-apple-textPrimary dark:hover:text-white bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => setModalMode('faculty')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-footnote font-medium text-apple-textSecondary dark:text-white/80 hover:text-apple-textPrimary dark:hover:text-white bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Faculty</span>
          </button>
        </div>
      </header>

      {/* Main Hero & Action Area */}
      <main className="my-auto py-10 space-y-10">
        {/* Title & Tagline */}
        <div className="space-y-3 text-center">
          <h1 className="text-title-1 font-semibold tracking-tight text-apple-textPrimary dark:text-white leading-tight">
            Connect instantly.<br />
            <span className="text-apple-blue font-bold">No login. Just a code.</span>
          </h1>
          <p className="text-subhead text-apple-textSecondary dark:text-white/60 max-w-sm mx-auto leading-relaxed">
            Zero-login real-time classroom chat and direct file sharing. Faster than AirDrop, simpler than WhatsApp.
          </p>
        </div>

        {/* Primary Action Card */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-ios-card p-6 md:p-8 shadow-ios-card border border-apple-border/60 dark:border-white/10 space-y-6">
          {/* Start a Room Button */}
          <div>
            <button
              onClick={() => setModalMode('create')}
              className="w-full py-4 px-6 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white font-semibold text-headline shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5 group active:scale-[0.99]"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>Start a New Room</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-apple-border/70 dark:border-white/10 w-full" />
            <span className="bg-white dark:bg-[#1C1C1E] px-3 text-caption uppercase tracking-wider text-apple-textSecondary dark:text-white/50 font-semibold">
              or join existing
            </span>
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
                  className="flex-1 px-4 py-3.5 bg-apple-secondaryBg dark:bg-white/10 rounded-ios-input text-headline font-mono font-semibold tracking-widest text-center text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/40 dark:placeholder:text-white/30 outline-none border border-apple-border/40 dark:border-white/10 focus:ring-2 focus:ring-apple-blue transition-all uppercase"
                />
                <button
                  type="submit"
                  disabled={cleanRoomCode(codeInput).length !== 6}
                  className="px-5 py-3.5 rounded-ios-btn bg-apple-blue hover:bg-apple-blueHover disabled:opacity-30 disabled:hover:bg-apple-blue text-white font-medium text-subhead transition-all flex items-center justify-center shrink-0 active:scale-[0.98]"
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

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-white/70 dark:bg-white/5 rounded-ios-btn border border-apple-border/40 dark:border-white/10 shadow-sm">
            <Zap className="w-4 h-4 text-apple-blue mx-auto mb-1" />
            <p className="text-caption font-semibold text-apple-textPrimary dark:text-white">Instant P2P</p>
            <p className="text-[11px] text-apple-textSecondary dark:text-white/50">Direct transfers</p>
          </div>
          <div className="p-3 bg-white/70 dark:bg-white/5 rounded-ios-btn border border-apple-border/40 dark:border-white/10 shadow-sm">
            <Lock className="w-4 h-4 text-apple-green mx-auto mb-1" />
            <p className="text-caption font-semibold text-apple-textPrimary dark:text-white">Zero Login</p>
            <p className="text-[11px] text-apple-textSecondary dark:text-white/50">No account needed</p>
          </div>
          <div className="p-3 bg-white/70 dark:bg-white/5 rounded-ios-btn border border-apple-border/40 dark:border-white/10 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-caption font-semibold text-apple-textPrimary dark:text-white">Self-Destructs</p>
            <p className="text-[11px] text-apple-textSecondary dark:text-white/50">Auto-deleted</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-caption text-apple-textSecondary dark:text-white/40 pt-6">
        <p>Built for modern classrooms • No server file storage • Ephemeral</p>
      </footer>

      {/* Display Name / Passphrase Modal */}
      <DisplayNameModal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        onSubmit={handleModalSubmit}
        title={
          modalMode === 'faculty'
            ? 'Start Room as Faculty'
            : modalMode === 'create'
            ? 'Choose Host Name'
            : `Join Room ${codeInput}`
        }
        actionText={modalMode === 'join' ? 'Enter Room' : 'Start Room'}
        defaultIsFaculty={modalMode === 'faculty'}
      />
    </div>
  );
};
