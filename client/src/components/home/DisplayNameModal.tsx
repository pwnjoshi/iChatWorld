import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Sparkles, Shield, User, Clock } from 'lucide-react';

interface DisplayNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (displayName: string, isFaculty: boolean, passphrase?: string, lifespanHours?: number) => void;
  title: string;
  actionText: string;
  defaultIsFaculty?: boolean;
}

const PRESET_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Casey', 'Riley', 'Avery', 'Cameron', 'Quinn'
];

const LIFESPAN_OPTIONS = [
  { label: '1 Hour', hours: 1 },
  { label: '3 Hours', hours: 3 },
  { label: '6 Hours', hours: 6 },
  { label: '12 Hours', hours: 12 },
  { label: '24 Hours', hours: 24 }
];

export const DisplayNameModal: React.FC<DisplayNameModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  actionText,
  defaultIsFaculty = false
}) => {
  const [name, setName] = useState('');
  const [isFaculty, setIsFaculty] = useState(defaultIsFaculty);
  const [passphrase, setPassphrase] = useState('');
  const [lifespanHours, setLifespanHours] = useState(24);
  const [error, setError] = useState('');

  const isCreating = title === 'Start a New Room';

  const getRandomName = () => {
    const random = PRESET_NAMES[Math.floor(Math.random() * PRESET_NAMES.length)];
    setName(random);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter a display name');
      return;
    }
    if (isFaculty && !passphrase.trim()) {
      setError('Please enter the faculty passphrase');
      return;
    }

    setError('');
    onSubmit(cleanName, isFaculty, isFaculty ? passphrase.trim() : undefined, isCreating ? lifespanHours : undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <label className="block text-footnote font-medium text-apple-textSecondary dark:text-white/70 mb-1.5">
            Your Display Name
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 w-4 h-4 text-apple-textSecondary dark:text-white/40 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Alex"
              autoFocus
              maxLength={24}
              className="w-full pl-10 pr-12 py-3 bg-apple-secondaryBg dark:bg-white/10 rounded-ios-input text-body text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/50 dark:placeholder:text-white/30 outline-none focus:ring-2 focus:ring-apple-blue/80 border border-apple-border/50 dark:border-white/10 transition-all"
            />
            <button
              type="button"
              onClick={getRandomName}
              title="Random name"
              className="absolute right-2 p-1.5 text-apple-textSecondary dark:text-white/60 hover:text-apple-blue dark:hover:text-apple-blue rounded-lg hover:bg-apple-tertiaryBg/60 dark:hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
          <p className="text-caption text-apple-textSecondary dark:text-white/50 mt-1">
            Visible only in this session. Never saved.
          </p>
        </div>

        {/* Room Auto-Disposal Lifespan Selector (Create Room only) */}
        {isCreating && (
          <div className="p-3 bg-apple-secondaryBg/80 dark:bg-white/5 rounded-ios-btn border border-apple-border/40 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-footnote font-medium text-apple-textPrimary dark:text-white">
                <Clock className="w-4 h-4 text-apple-blue" />
                <span>Room Auto-Disposal Lifespan</span>
              </div>
              <span className="text-[11px] font-mono text-apple-blue font-bold">
                {lifespanHours} Hours
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1 pt-1">
              {LIFESPAN_OPTIONS.map((opt) => {
                const isSelected = lifespanHours === opt.hours;
                return (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setLifespanHours(opt.hours)}
                    className={`py-1.5 px-1 rounded-lg text-caption font-semibold transition-all text-center ${
                      isSelected
                        ? 'bg-apple-blue text-white shadow-2xs'
                        : 'bg-white dark:bg-[#1C1C1E] text-apple-textSecondary dark:text-white/70 hover:text-apple-textPrimary dark:hover:text-white border border-apple-border/40 dark:border-white/5'
                    }`}
                  >
                    {opt.hours}h
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-apple-textSecondary dark:text-white/40">
              The room stays active even if all members disconnect, until this timer ends.
            </p>
          </div>
        )}

        {/* Faculty Toggle */}
        <div className="p-3 bg-apple-secondaryBg/80 dark:bg-white/5 rounded-ios-btn border border-apple-border/40 dark:border-white/10">
          <label className="flex items-center justify-between cursor-pointer select-none">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${isFaculty ? 'text-amber-500' : 'text-apple-textSecondary dark:text-white/50'}`} />
              <span className="text-subhead font-medium text-apple-textPrimary dark:text-white">I'm Faculty / Instructor</span>
            </div>
            <input
              type="checkbox"
              checked={isFaculty}
              onChange={(e) => setIsFaculty(e.target.checked)}
              className="w-4 h-4 accent-apple-blue rounded cursor-pointer"
            />
          </label>

          {isFaculty && (
            <div className="mt-2.5 pt-2.5 border-t border-apple-border/50 dark:border-white/10 animate-fade-in">
              <label className="block text-footnote text-apple-textSecondary dark:text-white/70 mb-1">
                Faculty Passphrase
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value);
                  setError('');
                }}
                placeholder="Enter passphrase (default: faculty123)"
                className="w-full px-3.5 py-2 bg-white dark:bg-[#1C1C1E] rounded-ios-input text-body text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/50 dark:placeholder:text-white/30 outline-none border border-apple-border dark:border-white/10 focus:ring-2 focus:ring-apple-blue/80 transition-all text-sm"
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-footnote text-apple-red font-medium animate-shake">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-full text-subhead font-medium text-apple-textPrimary dark:text-white bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 px-4 rounded-full text-subhead font-semibold text-white bg-apple-blue hover:bg-apple-blueHover transition-colors shadow-sm"
          >
            {actionText}
          </button>
        </div>
      </form>
    </Modal>
  );
};
