import React, { useState, useRef } from 'react';
import { Member, Message } from '../../types/index.js';
import { Avatar } from '../common/Avatar.js';
import { Shield, VolumeX, Volume2, Pin, UploadCloud, UserX, Trash2, X, AlertTriangle } from 'lucide-react';

interface FacultySlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currentMember: Member | null;
  chatMuted: boolean;
  pinnedAnnouncement?: Message | null;
  onToggleMute: (muted: boolean) => Promise<boolean>;
  onPinAnnouncement: (text: string | null) => Promise<boolean>;
  onBroadcastFile: (file: File) => Promise<void>;
  onKickMember: (socketId: string) => Promise<boolean>;
  onEndRoom: () => Promise<boolean>;
}

export const FacultySlideOver: React.FC<FacultySlideOverProps> = ({
  isOpen,
  onClose,
  members,
  currentMember,
  chatMuted,
  pinnedAnnouncement,
  onToggleMute,
  onPinAnnouncement,
  onBroadcastFile,
  onKickMember,
  onEndRoom
}) => {
  const [announcementText, setAnnouncementText] = useState(pinnedAnnouncement?.text || '');
  const [isPinning, setIsPinning] = useState(false);
  const broadcastInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSetAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPinning(true);
    await onPinAnnouncement(announcementText.trim() || null);
    setIsPinning(false);
  };

  const handleClearAnnouncement = async () => {
    setIsPinning(true);
    setAnnouncementText('');
    await onPinAnnouncement(null);
    setIsPinning(false);
  };

  const handleBroadcastFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onBroadcastFile(e.target.files[0]);
      if (broadcastInputRef.current) broadcastInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-ios-sheet z-10 flex flex-col justify-between overflow-y-auto animate-slide-left">
        {/* Header */}
        <div className="p-4 border-b border-apple-border/70 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-headline font-semibold text-apple-textPrimary">
                Host Controls
              </h3>
              <p className="text-caption text-apple-textSecondary">
                Moderation and room management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-apple-secondaryBg hover:bg-apple-tertiaryBg flex items-center justify-center text-apple-textSecondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Control Sections */}
        <div className="p-5 space-y-6 flex-1">
          {/* 1. Mute Chat Toggle */}
          <div className="p-4 rounded-ios-card bg-apple-secondaryBg/80 border border-apple-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {chatMuted ? (
                  <VolumeX className="w-5 h-5 text-apple-red" />
                ) : (
                  <Volume2 className="w-5 h-5 text-apple-green" />
                )}
                <div>
                  <h4 className="text-subhead font-semibold text-apple-textPrimary">
                    {chatMuted ? 'Chat is Muted' : 'Chat is Active'}
                  </h4>
                  <p className="text-caption text-apple-textSecondary">
                    {chatMuted
                      ? 'Students are in read-only mode (file sharing remains enabled).'
                      : 'All students can send chat messages.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onToggleMute(!chatMuted)}
              className={`w-full py-2.5 px-4 rounded-full text-footnote font-semibold transition-colors flex items-center justify-center gap-2 ${
                chatMuted
                  ? 'bg-apple-green text-white hover:bg-emerald-600'
                  : 'bg-apple-red text-white hover:bg-red-600'
              }`}
            >
              {chatMuted ? 'Unmute Student Chat' : 'Mute Student Chat'}
            </button>
          </div>

          {/* 2. Broadcast File (Pinned to Top) */}
          <div className="p-4 rounded-ios-card bg-amber-50/60 border border-amber-200/70 space-y-3">
            <div className="flex items-center gap-2 text-amber-900">
              <UploadCloud className="w-5 h-5 text-amber-700" />
              <h4 className="text-subhead font-semibold">Broadcast File to Room</h4>
            </div>
            <p className="text-caption text-amber-900/80">
              Push syllabus, assignment, or slide decks directly to the top of all students' screens.
            </p>

            <input
              ref={broadcastInputRef}
              type="file"
              onChange={handleBroadcastFileSelect}
              className="hidden"
            />

            <button
              onClick={() => broadcastInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-footnote transition-colors shadow-sm"
            >
              Choose File to Broadcast
            </button>
          </div>

          {/* 3. Sticky Announcement */}
          <div className="p-4 rounded-ios-card bg-apple-secondaryBg/80 border border-apple-border/50 space-y-3">
            <div className="flex items-center gap-2 text-apple-textPrimary">
              <Pin className="w-4 h-4 text-apple-blue" />
              <h4 className="text-subhead font-semibold">Sticky Announcement Banner</h4>
            </div>
            <form onSubmit={handleSetAnnouncement} className="space-y-2.5">
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="e.g. Please open Chapter 4 PDF..."
                className="w-full px-3.5 py-2 bg-white rounded-ios-input text-footnote text-apple-textPrimary border border-apple-border outline-none focus:ring-2 focus:ring-apple-blue/70"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPinning}
                  className="flex-1 py-2 px-3 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white text-footnote font-semibold transition-colors disabled:opacity-50"
                >
                  {pinnedAnnouncement ? 'Update Announcement' : 'Pin Announcement'}
                </button>
                {pinnedAnnouncement && (
                  <button
                    type="button"
                    onClick={handleClearAnnouncement}
                    className="py-2 px-3 rounded-full bg-apple-secondaryBg hover:bg-apple-tertiaryBg text-apple-textSecondary text-footnote font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* 4. Student Management (Kick) */}
          <div className="space-y-2">
            <h4 className="text-caption font-semibold uppercase tracking-wider text-apple-textSecondary px-1">
              Manage Participants ({members.length})
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-apple-border/50 rounded-ios-card p-2 bg-apple-secondaryBg/40">
              {members.map((m) => {
                const isSelf = m.socketId === currentMember?.socketId;
                return (
                  <div
                    key={m.socketId}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-apple-border/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={m.displayName} isCreator={m.isCreator} size="sm" />
                      <span className="text-footnote font-medium text-apple-textPrimary truncate">
                        {m.displayName} {isSelf ? '(You)' : ''}
                      </span>
                    </div>

                    {!isSelf && !m.isCreator && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove ${m.displayName} from this room?`)) {
                            onKickMember(m.socketId);
                          }
                        }}
                        title="Remove member"
                        className="p-1 text-apple-textSecondary hover:text-apple-red hover:bg-red-50 rounded-md transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Destructive End Session Footer */}
        <div className="p-4 border-t border-apple-border/70 bg-apple-secondaryBg/50 space-y-2">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to terminate this room session for everyone? All files and messages will be permanently deleted.')) {
                onEndRoom();
              }
            }}
            className="w-full py-3 px-4 rounded-full bg-apple-red hover:bg-red-600 text-white font-semibold text-footnote transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>End Session for Everyone</span>
          </button>
          <p className="text-[11px] text-apple-textSecondary text-center">
            Instantly deletes room state from server memory.
          </p>
        </div>
      </div>
    </div>
  );
};
