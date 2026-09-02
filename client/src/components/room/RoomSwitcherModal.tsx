import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { ActiveSessionRoom } from '../../types/index.js';
import { formatRoomCode, cleanRoomCode } from '../../utils/format.js';
import { Plus, ArrowRight, Shield, Check, Trash2, DoorOpen, Sparkles } from 'lucide-react';

interface RoomSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomCode: string;
  activeRooms: ActiveSessionRoom[];
  onSwitchRoom: (code: string) => void;
  onJoinNewRoom: (code: string) => void;
  onCreateNewRoom: () => void;
  onRemoveRoomFromHistory: (code: string) => void;
}

export const RoomSwitcherModal: React.FC<RoomSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentRoomCode,
  activeRooms,
  onSwitchRoom,
  onJoinNewRoom,
  onCreateNewRoom,
  onRemoveRoomFromHistory
}) => {
  const [newCodeInput, setNewCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');

  if (!isOpen) return null;

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanRoomCode(newCodeInput);
    if (clean.length !== 6) {
      setJoinError('Enter a valid 6-character code');
      return;
    }
    setJoinError('');
    onJoinNewRoom(formatRoomCode(newCodeInput));
    setNewCodeInput('');
    onClose();
  };

  const handleClearInactive = () => {
    for (const r of activeRooms) {
      if (r.code !== currentRoomCode) {
        onRemoveRoomFromHistory(r.code);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Room Switcher" maxWidth="max-w-md">
      <div className="space-y-5">
        {/* Active & Recent Rooms List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-caption font-semibold uppercase tracking-wider text-apple-textSecondary dark:text-white/60">
              Your Active Rooms ({activeRooms.length})
            </span>
            {activeRooms.length > 1 && (
              <button
                type="button"
                onClick={handleClearInactive}
                className="text-caption text-apple-red hover:underline flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Inactive</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {activeRooms.map((r) => {
              const isCurrent = r.code === currentRoomCode;
              return (
                <div
                  key={r.code}
                  className={`p-3 rounded-ios-card flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'bg-apple-blue text-white shadow-sm'
                      : 'bg-apple-secondaryBg/80 dark:bg-white/5 hover:bg-apple-tertiaryBg dark:hover:bg-white/10 text-apple-textPrimary dark:text-white border border-apple-border/50 dark:border-white/10'
                  }`}
                >
                  <div
                    onClick={() => {
                      if (!isCurrent) {
                        onSwitchRoom(r.code);
                        onClose();
                      }
                    }}
                    className="flex-1 cursor-pointer min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-headline tracking-wider">
                        {r.code}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-white/20 text-white font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                      {r.isFaculty && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                            isCurrent
                              ? 'bg-amber-400 text-amber-950'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                          }`}
                        >
                          <Shield className="w-2.5 h-2.5" /> Faculty
                        </span>
                      )}
                    </div>
                    <p className={`text-caption truncate mt-0.5 ${isCurrent ? 'text-white/80' : 'text-apple-textSecondary dark:text-white/60'}`}>
                      Joined as {r.displayName}
                    </p>
                  </div>

                  {!isCurrent && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onSwitchRoom(r.code);
                          onClose();
                        }}
                        className="p-2 rounded-full bg-white dark:bg-[#1C1C1E] hover:bg-apple-secondaryBg text-apple-blue font-semibold text-footnote transition-colors"
                        title="Switch to this room"
                      >
                        <DoorOpen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveRoomFromHistory(r.code)}
                        className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950 text-apple-textSecondary hover:text-apple-red transition-colors"
                        title="Remove from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Join Another Room */}
        <form onSubmit={handleJoinSubmit} className="space-y-2 pt-2 border-t border-apple-border/50 dark:border-white/10">
          <label className="block text-footnote font-medium text-apple-textSecondary dark:text-white/70">
            Switch / Join Another Room
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCodeInput}
              onChange={(e) => {
                setNewCodeInput(formatRoomCode(e.target.value));
                setJoinError('');
              }}
              placeholder="e.g. 482-901"
              maxLength={7}
              className="flex-1 px-3.5 py-2.5 bg-apple-secondaryBg dark:bg-white/10 rounded-ios-input text-headline font-mono font-semibold tracking-wider text-center text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/40 dark:placeholder:text-white/30 outline-none border border-apple-border/40 dark:border-white/10 focus:ring-2 focus:ring-apple-blue uppercase text-sm"
            />
            <button
              type="submit"
              disabled={cleanRoomCode(newCodeInput).length !== 6}
              className="px-4 py-2.5 rounded-ios-btn bg-apple-blue hover:bg-apple-blueHover text-white font-medium text-footnote transition-all disabled:opacity-40 shrink-0"
            >
              <span>Join</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
            </button>
          </div>
          {joinError && (
            <p className="text-footnote text-apple-red font-medium">{joinError}</p>
          )}
        </form>

        {/* Create New Room Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateNewRoom();
            }}
            className="w-full py-3 px-4 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 text-apple-blue dark:text-white font-semibold text-footnote transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Another Room</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
