import React, { useState, useRef, useEffect } from 'react';
import { Message, Member, Poll } from '../../types/index.js';
import { Avatar } from '../common/Avatar.js';
import { formatTime } from '../../utils/format.js';
import { VoiceRecorder } from './VoiceRecorder.js';
import { PollCard } from './PollCard.js';
import { Send, Pin, VolumeX, Mic, Search, Smile, Play, Pause, X, Edit3, Trash2, Check, Ban } from 'lucide-react';

interface ChatPanelProps {
  messages: Message[];
  currentMember: Member | null;
  chatMuted: boolean;
  pinnedAnnouncement?: Message | null;
  activePoll?: Poll | null;
  typingUsers: Map<string, string>;
  onSendMessage: (text: string, isCode?: boolean, codeLanguage?: string) => Promise<boolean>;
  onEditMessage?: (messageId: string, newText: string) => Promise<boolean>;
  onDeleteMessage?: (messageId: string) => Promise<boolean>;
  onSendAudio: (blob: Blob, duration: number) => Promise<boolean>;
  onReactToMessage: (messageId: string, emoji: string) => Promise<boolean>;
  onVotePoll: (pollId: string, optionId: string) => Promise<boolean>;
  onClosePoll: (pollId: string) => Promise<boolean>;
  onDeletePoll?: (pollId: string) => Promise<boolean>;
  onSendTyping: (isTyping: boolean) => void;
}

const TAPBACK_EMOJIS = ['❤️', '👍', '👏', '💡', '❓', '😂'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentMember,
  chatMuted,
  pinnedAnnouncement,
  activePoll,
  typingUsers,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onSendAudio,
  onReactToMessage,
  onVotePoll,
  onClosePoll,
  onDeletePoll,
  onSendTyping
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);

  // Edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isFacultyOrHost = currentMember?.isFaculty || currentMember?.isCreator;
  const canSend = !chatMuted || isFacultyOrHost;

  useEffect(() => {
    if (!searchQuery && !editingMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers, searchQuery, editingMessageId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onSendTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onSendTyping(false);
    }, 1500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending || !canSend) return;

    setIsSending(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onSendTyping(false);

    const success = await onSendMessage(text);
    if (success) {
      setInputText('');
    }
    setIsSending(false);
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
    setActiveReactionMenu(null);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editingText.trim() || !onEditMessage) return;
    await onEditMessage(messageId, editingText.trim());
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (onDeleteMessage && window.confirm('Delete this message for everyone?')) {
      await onDeleteMessage(messageId);
      setActiveReactionMenu(null);
    }
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()) || m.senderName.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const activeTypers = Array.from(typingUsers.entries())
    .filter(([socketId]) => socketId !== currentMember?.socketId)
    .map(([, name]) => name);

  return (
    <div className="flex flex-col h-full bg-apple-bg dark:bg-black relative transition-colors">
      {/* Search Header Bar (if open) */}
      {showSearch && (
        <div className="p-2.5 bg-white dark:bg-[#1C1C1E] border-b border-apple-border dark:border-white/10 flex items-center gap-2 animate-fade-in">
          <Search className="w-4 h-4 text-apple-textSecondary ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages in room..."
            autoFocus
            className="flex-1 px-3 py-1.5 bg-apple-secondaryBg dark:bg-white/10 rounded-lg text-footnote text-apple-textPrimary dark:text-white outline-none focus:ring-1 focus:ring-apple-blue"
          />
          {searchQuery && (
            <span className="text-caption text-apple-textSecondary">
              {filteredMessages.length} found
            </span>
          )}
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="p-1 rounded-full text-apple-textSecondary hover:bg-apple-secondaryBg dark:hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pinned Announcement Banner */}
      {pinnedAnnouncement && (
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800 px-4 py-2.5 flex items-start gap-2.5 shrink-0 animate-fade-in">
          <Pin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-footnote text-amber-950 dark:text-amber-200 flex-1">
            <span className="font-semibold">{pinnedAnnouncement.senderName}: </span>
            <span>{pinnedAnnouncement.text}</span>
          </div>
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Active Poll Card Pinned at Top of Chat if exists */}
        {activePoll && (
          <PollCard
            poll={activePoll}
            currentSocketId={currentMember?.socketId}
            isFaculty={isFacultyOrHost}
            onVote={onVotePoll}
            onClosePoll={onClosePoll}
            onDeletePoll={onDeletePoll}
          />
        )}

        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-apple-textSecondary dark:text-white/40">
            <p className="text-subhead font-medium text-apple-textPrimary dark:text-white">
              {searchQuery ? 'No matching messages' : 'No messages yet'}
            </p>
            <p className="text-footnote mt-1">
              {searchQuery ? 'Try searching for something else.' : 'Say hello or share lecture notes with everyone.'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id || index} className="flex justify-center my-2">
                  <span className="text-[12px] bg-apple-secondaryBg/80 dark:bg-white/10 text-apple-textSecondary dark:text-white/60 px-3 py-1 rounded-full text-center">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isOwn = msg.senderId === currentMember?.socketId;
            const canModerateDelete = isFacultyOrHost || isOwn;
            const showSender = !isOwn && (index === 0 || messages[index - 1].senderId !== msg.senderId);

            // WhatsApp / iMessage deleted message state
            if (msg.isDeleted) {
              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} my-1 opacity-70`}
                >
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-footnote italic flex items-center gap-1.5 border border-dashed ${
                      isOwn
                        ? 'bg-apple-secondaryBg/40 dark:bg-white/5 border-apple-border/50 text-apple-textSecondary dark:text-white/50'
                        : 'bg-apple-secondaryBg/40 dark:bg-white/5 border-apple-border/50 text-apple-textSecondary dark:text-white/50'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5 opacity-60" />
                    <span>This message was deleted</span>
                  </div>
                  <span className="text-[10px] text-apple-textSecondary/70 px-1 mt-0.5">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group relative`}
              >
                {showSender && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-caption font-semibold text-apple-textSecondary dark:text-white/60">
                      {msg.senderName}
                    </span>
                    {msg.isFaculty && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/60 dark:text-amber-300 px-1.5 py-0.2 rounded">
                        Faculty
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-end gap-1.5 max-w-[84%] relative">
                  {!isOwn && (
                    <Avatar
                      name={msg.senderName}
                      isFaculty={msg.isFaculty}
                      size="sm"
                      className="mb-0.5"
                    />
                  )}

                  <div className="relative">
                    {/* Inline Editing Mode */}
                    {editingMessageId === msg.id ? (
                      <div className="p-2 bg-white dark:bg-[#1C1C1E] border border-apple-blue rounded-2xl shadow-md space-y-1.5 min-w-[240px]">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          autoFocus
                          className="w-full px-3 py-1.5 bg-apple-secondaryBg dark:bg-white/10 rounded-lg text-body text-apple-textPrimary dark:text-white outline-none focus:ring-1 focus:ring-apple-blue"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-2.5 py-1 text-caption text-apple-textSecondary hover:text-apple-textPrimary"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(msg.id)}
                            className="px-3 py-1 rounded-full bg-apple-blue text-white text-caption font-semibold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Message Bubble */
                      <div
                        onDoubleClick={() => setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id)}
                        className={`px-4 py-2.5 rounded-2xl text-body break-words select-text ${
                          isOwn
                            ? 'bg-apple-blue text-white rounded-br-sm shadow-sm'
                            : msg.isFaculty
                            ? 'bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100 border border-amber-200/70 dark:border-amber-800 rounded-bl-sm'
                            : 'bg-white dark:bg-[#1C1C1E] text-apple-textPrimary dark:text-white border border-apple-border/50 dark:border-white/10 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {msg.isAudio && msg.audioUrl ? (
                          <div className="flex items-center gap-2 py-1">
                            <audio src={msg.audioUrl} controls className="h-8 max-w-[200px]" />
                          </div>
                        ) : msg.isCode ? (
                          <pre className="p-3 bg-black/90 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
                            <code>{msg.text}</code>
                          </pre>
                        ) : (
                          <p className="leading-relaxed">{msg.text}</p>
                        )}
                      </div>
                    )}

                    {/* Reactions Display Pills */}
                    {msg.reactions && Object.values(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 -mb-1">
                        {Object.values(msg.reactions).map((reaction) => {
                          const hasUserReacted = currentMember && reaction.users.some(u => u.socketId === currentMember.socketId);
                          return (
                            <button
                              key={reaction.emoji}
                              onClick={() => onReactToMessage(msg.id, reaction.emoji)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption border shadow-sm transition-all ${
                                hasUserReacted
                                  ? 'bg-blue-50 dark:bg-blue-950/40 border-apple-blue text-apple-blue'
                                  : 'bg-white dark:bg-[#1C1C1E] border-apple-border/60 dark:border-white/10 text-apple-textPrimary dark:text-white'
                              }`}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="font-semibold text-[11px]">{reaction.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions Trigger Icons: React, Edit, Delete */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity mb-1">
                    <button
                      onClick={() => setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id)}
                      className="p-1 text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10"
                      title="Add reaction"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>

                    {isOwn && !msg.isAudio && (
                      <button
                        onClick={() => handleStartEdit(msg)}
                        className="p-1 text-apple-textSecondary hover:text-apple-blue rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10"
                        title="Edit message"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canModerateDelete && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 text-apple-textSecondary hover:text-apple-red rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10"
                        title={isOwn ? 'Delete message' : 'Delete as moderator'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Tapback Bar Dropdown */}
                  {activeReactionMenu === msg.id && (
                    <div
                      className={`absolute bottom-full mb-1 z-30 p-1.5 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md rounded-full shadow-ios-dropdown border border-apple-border dark:border-white/10 flex items-center gap-1.5 animate-scale-up ${
                        isOwn ? 'right-0' : 'left-0'
                      }`}
                    >
                      {TAPBACK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            onReactToMessage(msg.id, emoji);
                            setActiveReactionMenu(null);
                          }}
                          className="w-7 h-7 flex items-center justify-center hover:scale-125 transition-transform text-base"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-apple-textSecondary dark:text-white/40 px-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>{formatTime(msg.timestamp)}</span>
                  {msg.isEdited && <span className="italic">(edited)</span>}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {activeTypers.length > 0 && (
          <div className="flex items-center gap-2 text-caption text-apple-textSecondary dark:text-white/60 italic animate-pulse">
            <span>
              {activeTypers.join(', ')} {activeTypers.length > 1 ? 'are' : 'is'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input or Muted Banner */}
      <div className="p-3 bg-white dark:bg-black border-t border-apple-border/70 dark:border-white/10 shrink-0">
        {isRecordingVoice ? (
          <VoiceRecorder
            onSendAudio={onSendAudio}
            onCancel={() => setIsRecordingVoice(false)}
          />
        ) : chatMuted && !isFacultyOrHost ? (
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-apple-secondaryBg dark:bg-white/10 rounded-ios-input text-apple-textSecondary text-footnote">
            <VolumeX className="w-4 h-4 text-apple-textSecondary" />
            <span>Chat is muted by faculty (files and polls remain active)</span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              title="Search messages"
              className="p-2 text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={chatMuted ? "You can post as faculty..." : "Type a message..."}
              maxLength={500}
              className="flex-1 px-4 py-2.5 bg-apple-secondaryBg dark:bg-white/10 rounded-full text-body text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/50 outline-none focus:ring-2 focus:ring-apple-blue/70 transition-all"
            />

            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              title="Record voice note"
              className="p-2.5 rounded-full text-apple-textSecondary hover:text-apple-blue hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors shrink-0"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-2.5 rounded-full bg-apple-blue hover:bg-apple-blueHover disabled:opacity-40 text-white transition-all shadow-sm shrink-0 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
