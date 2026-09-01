import React, { useState, useRef, useEffect } from 'react';
import { Message, Member, Poll } from '../../types/index.js';
import { Avatar } from '../common/Avatar.js';
import { formatTime } from '../../utils/format.js';
import { VoiceRecorder } from './VoiceRecorder.js';
import { PollCard } from './PollCard.js';
import {
  Send,
  Pin,
  VolumeX,
  Mic,
  Search,
  Smile,
  X,
  Edit3,
  Trash2,
  Check,
  Ban,
  Sparkles,
  HelpCircle,
  Copy,
  Terminal,
  MoreHorizontal
} from 'lucide-react';

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

const TAPBACK_EMOJIS = ['❤️', '👍', '😂', '🔥', '🎉', '💡'];

// Helper to render formatted markdown & code blocks cleanly
const FormattedMessageText: React.FC<{ text: string; isOwn?: boolean }> = ({ text, isOwn }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split by code blocks ```lang ... ```
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1.5 leading-relaxed text-[13.5px] sm:text-[14px]">
      {parts.map((part, pIdx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/);
          const lang = match ? match[1] || 'code' : 'code';
          const code = match ? match[2].trim() : part.slice(3, -3).trim();

          return (
            <div
              key={pIdx}
              className="my-2 rounded-xl overflow-hidden bg-[#18181B] border border-white/10 text-white font-mono text-[12px] shadow-sm select-text"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10 text-[11px] text-white/60">
                <div className="flex items-center gap-1.5 font-medium">
                  <Terminal className="w-3 h-3 text-apple-blue" />
                  <span className="uppercase text-[10px] tracking-wider text-white/80">{lang}</span>
                </div>
                <button
                  onClick={() => handleCopyCode(code, pIdx)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors text-[10px]"
                  title="Copy code"
                >
                  {copiedIndex === pIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto leading-normal text-emerald-300">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Parse regular markdown lines (bold, bullet points, headers)
        const lines = part.split('\n');
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              if (!line.trim()) return <div key={lIdx} className="h-1" />;

              // Bullet point formatting
              const isBullet = line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ');
              const cleanLine = isBullet ? line.replace(/^[•\-\*]\s+/, '') : line;

              // Parse **bold** and `code` inline
              const tokens = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);

              const lineContent = tokens.map((tok, tIdx) => {
                if (tok.startsWith('**') && tok.endsWith('**')) {
                  return (
                    <strong key={tIdx} className="font-bold">
                      {tok.slice(2, -2)}
                    </strong>
                  );
                }
                if (tok.startsWith('`') && tok.endsWith('`')) {
                  return (
                    <code
                      key={tIdx}
                      className={`px-1.5 py-0.2 rounded font-mono text-[12px] ${
                        isOwn ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/15 text-apple-blue dark:text-blue-400'
                      }`}
                    >
                      {tok.slice(1, -1)}
                    </code>
                  );
                }
                return <span key={tIdx}>{tok}</span>;
              });

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 pl-1">
                    <span className="text-apple-blue dark:text-blue-400 select-none">•</span>
                    <div className="flex-1">{lineContent}</div>
                  </div>
                );
              }

              return <p key={lIdx} className="leading-snug">{lineContent}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

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
      {/* Search Header Bar */}
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
      <div className="flex-1 overflow-y-auto p-2 sm:p-3.5 space-y-1.5 sm:space-y-2">
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
            <p className="text-subhead font-semibold text-apple-textPrimary dark:text-white">
              {searchQuery ? 'No matching messages' : 'No messages yet'}
            </p>
            <p className="text-footnote mt-1">
              {searchQuery ? 'Try searching for something else.' : 'Say hello or share notes with everyone in this room.'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id || index} className="flex justify-center my-1.5">
                  <span className="text-[11px] font-medium bg-apple-secondaryBg/90 dark:bg-white/10 text-apple-textSecondary dark:text-white/60 px-3 py-0.5 rounded-full text-center max-w-sm leading-normal">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isOwn = msg.senderId === currentMember?.socketId;
            const isAI = msg.senderId === 'ai';
            const canModerateDelete = isFacultyOrHost || isOwn;
            const showSender = !isOwn && (index === 0 || messages[index - 1].senderId !== msg.senderId);

            // Deleted message state
            if (msg.isDeleted) {
              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} my-0.5 opacity-60`}
                >
                  <div className="px-3 py-1 rounded-2xl text-[12px] italic flex items-center gap-1.5 border border-dashed bg-apple-secondaryBg/40 dark:bg-white/5 border-apple-border/50 text-apple-textSecondary dark:text-white/50">
                    <Ban className="w-3 h-3 opacity-60" />
                    <span>This message was deleted</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group relative`}
              >
                {/* Sender Name (Only 1 Clean Header) */}
                {showSender && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    {isAI ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-apple-blue dark:text-blue-400">
                        <Sparkles className="w-3 h-3" />
                        <span>iChatWorld AI</span>
                      </span>
                    ) : (
                      <>
                        <span className="text-[11px] font-bold text-apple-textSecondary dark:text-white/70">
                          {msg.senderName}
                        </span>
                        {msg.isFaculty && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/60 dark:text-amber-300 px-1.5 py-0.2 rounded-full">
                            Faculty
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-1.5 max-w-[92%] sm:max-w-[80%] relative">
                  {!isOwn && (
                    <Avatar
                      name={isAI ? 'AI' : msg.senderName}
                      isFaculty={msg.isFaculty}
                      size="sm"
                      className={`w-6 h-6 text-[10px] shrink-0 mt-0.5 ${isAI ? 'bg-gradient-to-tr from-purple-500 to-blue-500 text-white' : ''}`}
                    />
                  )}

                  <div className="relative min-w-0 flex-1">
                    {/* Inline Editing Mode */}
                    {editingMessageId === msg.id ? (
                      <div className="p-2 bg-white dark:bg-[#1C1C1E] border border-apple-blue rounded-2xl shadow-md space-y-1.5 min-w-[220px]">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          autoFocus
                          className="w-full px-3 py-1 bg-apple-secondaryBg dark:bg-white/10 rounded-lg text-[13.5px] text-apple-textPrimary dark:text-white outline-none focus:ring-1 focus:ring-apple-blue"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-2 py-0.5 text-caption text-apple-textSecondary hover:text-apple-textPrimary"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(msg.id)}
                            className="px-2.5 py-0.5 rounded-full bg-apple-blue text-white text-caption font-semibold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Message Bubble */
                      <div
                        onClick={() => setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id)}
                        className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl text-[13.5px] sm:text-[14px] leading-snug break-words shadow-2xs select-text cursor-pointer transition-all active:scale-[0.99] ${
                          isOwn
                            ? 'bg-apple-blue text-white rounded-br-xs'
                            : isAI
                            ? 'bg-white dark:bg-[#1C1C1E] text-apple-textPrimary dark:text-white border border-purple-200/60 dark:border-purple-900/40 rounded-bl-xs'
                            : msg.isFaculty
                            ? 'bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100 border border-amber-200/70 dark:border-amber-800 rounded-bl-xs'
                            : 'bg-white dark:bg-[#1C1C1E] text-apple-textPrimary dark:text-white border border-apple-border/50 dark:border-white/10 rounded-bl-xs'
                        }`}
                      >
                        {msg.isAudio && msg.audioUrl ? (
                          <div className="flex items-center gap-2 py-0.5">
                            <audio src={msg.audioUrl} controls className="h-7 max-w-[180px]" />
                          </div>
                        ) : msg.isCode ? (
                          <pre className="p-2.5 bg-black/90 text-emerald-400 rounded-xl font-mono text-[12px] overflow-x-auto leading-relaxed">
                            <code>{msg.text}</code>
                          </pre>
                        ) : (
                          <FormattedMessageText text={msg.text} isOwn={isOwn} />
                        )}

                        <div className={`flex items-center justify-end gap-1 text-[9.5px] mt-0.5 ${isOwn ? 'text-white/75' : 'text-apple-textSecondary/60 dark:text-white/40'}`}>
                          <span>{formatTime(msg.timestamp)}</span>
                          {msg.isEdited && <span>• edited</span>}
                        </div>
                      </div>
                    )}

                    {/* Reactions Display Chips */}
                    {msg.reactions && Object.values(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 -mb-0.5">
                        {Object.values(msg.reactions).map((reaction) => {
                          const hasUserReacted = currentMember && reaction.users.some(u => u.socketId === currentMember.socketId);
                          return (
                            <button
                              key={reaction.emoji}
                              onClick={(e) => {
                                e.stopPropagation();
                                onReactToMessage(msg.id, reaction.emoji);
                              }}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[11px] border shadow-2xs transition-all active:scale-90 ${
                                hasUserReacted
                                  ? 'bg-blue-50 dark:bg-blue-950/40 border-apple-blue text-apple-blue'
                                  : 'bg-white dark:bg-[#1C1C1E] border-apple-border/60 dark:border-white/10 text-apple-textPrimary dark:text-white'
                              }`}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="font-semibold text-[9.5px]">{reaction.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions Trigger (Mobile & Desktop) */}
                  <div className="opacity-0 group-hover:opacity-100 sm:flex hidden items-center gap-0.5 transition-opacity mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id);
                      }}
                      className="p-1 text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10"
                      title="React"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>

                    {isOwn && !msg.isAudio && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(msg);
                        }}
                        className="p-1 text-apple-textSecondary hover:text-apple-blue rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canModerateDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(msg.id);
                        }}
                        className="p-1 text-apple-textSecondary hover:text-apple-red rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Floating WhatsApp/Instagram Style Reaction Popover */}
                  {activeReactionMenu === msg.id && (
                    <div
                      className={`absolute bottom-full mb-1 z-30 p-1 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md rounded-full shadow-xl border border-apple-border/80 dark:border-white/15 flex items-center gap-1 animate-scale-up ${
                        isOwn ? 'right-0' : 'left-8'
                      }`}
                    >
                      {TAPBACK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReactToMessage(msg.id, emoji);
                            setActiveReactionMenu(null);
                          }}
                          className="w-7 h-7 flex items-center justify-center hover:scale-125 transition-transform text-sm active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}

                      {/* Mobile extra actions */}
                      {isOwn && !msg.isAudio && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(msg);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-apple-textSecondary hover:text-apple-blue rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10 text-xs"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canModerateDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(msg.id);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-apple-red hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full text-xs"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {activeTypers.length > 0 && (
          <div className="flex items-center gap-2 text-caption text-apple-textSecondary dark:text-white/60 italic animate-pulse px-1">
            <span>
              {activeTypers.join(', ')} {activeTypers.length > 1 ? 'are' : 'is'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick @ai & Feature Prompt Chips */}
      {canSend && !isRecordingVoice && (
        <div className="px-2.5 py-1.5 bg-white/80 dark:bg-black/80 backdrop-blur border-t border-apple-border/40 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x select-none">
          <button
            type="button"
            onClick={() => setInputText('@ai explain ')}
            className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-2xs"
          >
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>@ai explain</span>
          </button>
          <button
            type="button"
            onClick={() => setInputText('@ai quiz me on ')}
            className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-2xs"
          >
            <HelpCircle className="w-3 h-3 text-blue-500" />
            <span>@ai quiz me</span>
          </button>
          <button
            type="button"
            onClick={() => setInputText('@ai list all features and how to use them')}
            className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-2xs"
          >
            <span>🛠️ @ai features</span>
          </button>
          <button
            type="button"
            onClick={() => setInputText('@ai summarize our discussion in 3 key points')}
            className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-2xs"
          >
            <span>📝 @ai summarize</span>
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-2 sm:p-2.5 bg-white/95 dark:bg-black/95 border-t border-apple-border/70 dark:border-white/10 shrink-0 pb-safe">
        {isRecordingVoice ? (
          <VoiceRecorder
            onSendAudio={onSendAudio}
            onCancel={() => setIsRecordingVoice(false)}
          />
        ) : chatMuted && !isFacultyOrHost ? (
          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-apple-secondaryBg dark:bg-white/10 rounded-2xl text-apple-textSecondary text-footnote">
            <VolumeX className="w-4 h-4 text-apple-textSecondary" />
            <span>Chat is muted by faculty</span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-apple-secondaryBg dark:bg-white/10 rounded-full px-3 py-0.5 border border-apple-border/60 dark:border-white/10 focus-within:ring-2 focus-within:ring-apple-blue transition-all">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={chatMuted ? "Post as faculty..." : "Type a message or @ai..."}
                maxLength={500}
                className="flex-1 bg-transparent py-1.5 text-[14px] text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/50 dark:placeholder:text-white/30 outline-none min-w-0"
              />

              <button
                type="button"
                onClick={() => setIsRecordingVoice(true)}
                title="Record voice note"
                className="p-1 rounded-full text-apple-textSecondary hover:text-apple-blue transition-colors shrink-0"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-2 rounded-full bg-apple-blue hover:bg-apple-blueHover disabled:opacity-30 text-white transition-all shadow-sm shrink-0 active:scale-95 flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
