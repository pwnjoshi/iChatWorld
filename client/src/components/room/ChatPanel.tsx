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
  CheckCheck,
  Ban,
  Copy,
  Terminal,
  Sparkles,
  Bot
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

// Helper to render formatted markdown, tables, headings & code blocks cleanly
const FormattedMessageText: React.FC<{ text: string; isOwn?: boolean }> = ({ text, isOwn }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse inline bold, italic, code, quotes, and @ai badges
  const parseInlineMarkdown = (content: string) => {
    // Tokenize bold (**text**), italic (*text* or _text_), code (`text`), and @ai
    const tokens = content.split(/(\*\*.*?\*\*|\*[^*]+?\*|`.*?`|@ai\b|@AI\b|@Ai\b)/gi);

    return tokens.map((tok, tIdx) => {
      if (tok.startsWith('**') && tok.endsWith('**')) {
        return (
          <strong key={tIdx} className="font-bold text-inherit">
            {tok.slice(2, -2)}
          </strong>
        );
      }
      if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2 && !tok.startsWith('**')) {
        return (
          <em key={tIdx} className="italic text-inherit">
            {tok.slice(1, -1)}
          </em>
        );
      }
      if (tok.startsWith('`') && tok.endsWith('`')) {
        return (
          <code
            key={tIdx}
            className={`px-1.5 py-0.5 rounded font-mono text-[12px] ${
              isOwn ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/15 text-apple-blue dark:text-blue-400'
            }`}
          >
            {tok.slice(1, -1)}
          </code>
        );
      }
      if (tok.toLowerCase() === '@ai') {
        return (
          <span
            key={tIdx}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-lg text-[12px] font-bold tracking-wide shadow-2xs select-none align-baseline transition-all ${
              isOwn
                ? 'bg-white text-apple-blue shadow-sm'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xs'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>@ai</span>
          </span>
        );
      }
      return <span key={tIdx}>{tok}</span>;
    });
  };

  // Split by code blocks ```lang ... ```
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 leading-relaxed text-[13.5px] sm:text-[14px]">
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

        // Parse regular markdown lines (headings, tables, lists, quotes)
        const rawLines = part.split('\n');
        return (
          <div key={pIdx} className="space-y-1">
            {rawLines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-0.5" />;

              // Horizontal Rule
              if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
                return <hr key={lIdx} className="my-2 border-current opacity-20" />;
              }

              // Headers: #, ##, ###, ####
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={lIdx} className="text-[16px] font-extrabold tracking-tight mt-2 mb-1">
                    {parseInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
                  </h1>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={lIdx} className="text-[15px] font-bold tracking-tight mt-1.5 mb-1">
                    {parseInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
                  </h2>
                );
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={lIdx} className="text-[14px] font-bold tracking-tight mt-1 mb-0.5 flex items-center gap-1">
                    {parseInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
                  </h3>
                );
              }
              if (trimmed.startsWith('#### ')) {
                return (
                  <h4 key={lIdx} className="text-[13px] font-bold tracking-wide mt-1 uppercase opacity-90">
                    {parseInlineMarkdown(trimmed.replace(/^####\s+/, ''))}
                  </h4>
                );
              }

              // Numbered list items (e.g. "1. Core Concept:")
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 pl-1 my-0.5">
                    <span className="font-bold text-[12px] opacity-80 min-w-[16px] select-none">
                      {numMatch[1]}.
                    </span>
                    <div className="flex-1">{parseInlineMarkdown(numMatch[2])}</div>
                  </div>
                );
              }

              // Bullet list items (e.g. "* item", "- item", "• item")
              const isBullet = /^[•\-\*]\s+/.test(trimmed);
              if (isBullet) {
                const cleanItem = trimmed.replace(/^[•\-\*]\s+/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 pl-1 my-0.5">
                    <span className="text-apple-blue dark:text-blue-400 font-bold select-none text-[13px]">•</span>
                    <div className="flex-1">{parseInlineMarkdown(cleanItem)}</div>
                  </div>
                );
              }

              // Table row parsing (e.g. "| Col 1 | Col 2 |")
              if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                // Check if it's a separator line like | --- | --- |
                if (/^\|[\s\-:]+\|\s*$/.test(trimmed)) {
                  return null;
                }
                const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
                return (
                  <div key={lIdx} className="grid grid-flow-col auto-cols-fr gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-lg border border-current/10 text-[12px]">
                    {cells.map((c, cIdx) => (
                      <div key={cIdx} className="px-1">{parseInlineMarkdown(c)}</div>
                    ))}
                  </div>
                );
              }

              return <p key={lIdx} className="leading-snug">{parseInlineMarkdown(trimmed)}</p>;
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

  // Edit & Copy state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopyMessage = (msg: Message) => {
    navigator.clipboard.writeText(msg.text);
    setCopiedMessageId(msg.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isHost = !!currentMember?.isCreator;
  const canSend = !chatMuted || isHost;

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
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800 px-4 py-2 flex items-start gap-2.5 shrink-0 animate-fade-in">
          <Pin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-footnote text-amber-950 dark:text-amber-200 flex-1">
            <span className="font-semibold">{pinnedAnnouncement.senderName}: </span>
            <span>{pinnedAnnouncement.text}</span>
          </div>
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3.5 space-y-2">
        {/* Active Poll Card Pinned at Top of Chat if exists */}
        {activePoll && (
          <PollCard
            poll={activePoll}
            currentSocketId={currentMember?.socketId}
            isFaculty={isHost}
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
              {searchQuery ? 'Try searching for something else.' : 'Say hello or ask @ai anything in this room.'}
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
            const canModerateDelete = isHost || isOwn;
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
                {/* Sender Name Bar (Clean WhatsApp/Telegram style) */}
                {showSender && (
                  <div className="flex items-center gap-1.5 mb-1 pl-8 pr-1">
                    {isAI ? (
                      <span className="text-[12px] font-bold text-apple-blue dark:text-blue-400">
                        iChatWorld AI
                      </span>
                    ) : (
                      <>
                        <span className="text-[12px] font-bold text-apple-textPrimary dark:text-white">
                          {msg.senderName}
                        </span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-1.5 max-w-[92%] sm:max-w-[80%] relative">
                  {!isOwn && (
                    <Avatar
                      name={msg.senderName}
                      isAI={isAI}
                      size="sm"
                      className="mt-0.5 shrink-0"
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
                      /* Message Bubble */
                      <div
                        onClick={() => setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id)}
                        className={`px-3.5 py-2 rounded-2xl text-[13.5px] sm:text-[14px] leading-snug break-words shadow-2xs select-text cursor-pointer transition-all active:scale-[0.99] ${
                          isOwn
                            ? 'bg-apple-blue text-white rounded-br-xs'
                            : isAI
                            ? 'bg-white dark:bg-[#1C1C1E] text-apple-textPrimary dark:text-white border border-purple-200/60 dark:border-purple-900/40 rounded-bl-xs'
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

                        {/* Timestamp & Delivery Feedback Ticks */}
                        <div className={`flex items-center justify-end gap-1 text-[9.5px] mt-1 ${isOwn ? 'text-white/80' : 'text-apple-textSecondary/60 dark:text-white/40'}`}>
                          <span>{formatTime(msg.timestamp)}</span>
                          {msg.isEdited && <span>• edited</span>}
                          {isOwn && (
                            <CheckCheck className="w-3 h-3 text-white/90 shrink-0" />
                          )}
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

                  {/* ── Desktop Hover Quick-Action Floating Pill (Hidden on mobile and when tapback menu is active) ── */}
                  {activeReactionMenu !== msg.id && (
                    <div
                      className={`absolute -top-3.5 z-20 hidden md:group-hover:flex items-center gap-0.5 px-1.5 py-0.5 bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-md rounded-full border border-apple-border/70 dark:border-white/15 shadow-sm transition-all animate-fade-in ${
                        isOwn ? 'right-2' : 'left-8'
                      }`}
                    >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id);
                      }}
                      className="p-1 rounded-full text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors"
                      title="React with Emoji"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyMessage(msg);
                      }}
                      className="p-1 rounded-full text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors"
                      title="Copy Message"
                    >
                      {copiedMessageId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-apple-green" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isOwn && !msg.isAudio && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(msg);
                        }}
                        className="p-1 rounded-full text-apple-textSecondary hover:text-apple-blue hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="Edit Message"
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
                        className="p-1 rounded-full text-apple-textSecondary hover:text-apple-red hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete Message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                  {/* ── Integrated Floating Tapback & Actions Menu ── */}
                  {activeReactionMenu === msg.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute -top-10 z-30 p-1 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl rounded-full shadow-xl border border-apple-border/80 dark:border-white/15 flex items-center gap-0.5 animate-scale-up ${
                        isOwn ? 'right-0' : 'left-0 sm:left-8'
                      }`}
                    >
                      {TAPBACK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            onReactToMessage(msg.id, emoji);
                            setActiveReactionMenu(null);
                          }}
                          className="w-7 h-7 flex items-center justify-center hover:scale-125 transition-transform text-[15px] active:scale-95 rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10"
                        >
                          {emoji}
                        </button>
                      ))}

                      <div className="w-[1px] h-4 bg-apple-border/60 dark:border-white/10 mx-0.5" />

                      <button
                        onClick={() => {
                          handleCopyMessage(msg);
                          setActiveReactionMenu(null);
                        }}
                        className="w-7 h-7 flex items-center justify-center text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10 transition-colors"
                        title="Copy"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-apple-green" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isOwn && !msg.isAudio && (
                        <button
                          onClick={() => {
                            handleStartEdit(msg);
                            setActiveReactionMenu(null);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-apple-textSecondary hover:text-apple-blue rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canModerateDelete && (
                        <button
                          onClick={() => {
                            handleDeleteMessage(msg.id);
                            setActiveReactionMenu(null);
                          }}
                          className="w-7 h-7 flex items-center justify-center text-apple-textSecondary hover:text-apple-red rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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

        {/* Real-time Typing Indicator in message flow */}
        {activeTypers.length > 0 && (
          <div className="flex items-center gap-2 text-[12px] text-apple-textSecondary dark:text-white/60 italic pl-8 py-1">
            <span className="inline-flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse delay-75" />
              <span className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse delay-150" />
            </span>
            <span>
              {activeTypers.join(', ')} {activeTypers.length > 1 ? 'are' : 'is'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Clean Input Bar */}
      <div className="p-2 sm:p-2.5 bg-white/95 dark:bg-black/95 border-t border-apple-border/70 dark:border-white/10 shrink-0 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        {isRecordingVoice ? (
          <VoiceRecorder
            onSendAudio={onSendAudio}
            onCancel={() => setIsRecordingVoice(false)}
          />
        ) : chatMuted && !isHost ? (
          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-apple-secondaryBg dark:bg-white/10 rounded-2xl text-apple-textSecondary text-footnote">
            <VolumeX className="w-4 h-4 text-apple-textSecondary" />
            <span>Chat is muted by room host</span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-1.5">
            {/* Quick @ai suggestion popup when typing '@' */}
            {/@\w*$/i.test(inputText) && !/@ai\b/i.test(inputText) && (
              <div className="flex items-center gap-1.5 animate-scale-up pl-1">
                <button
                  type="button"
                  onClick={() => setInputText((prev) => prev.replace(/@\w*$/, '@ai '))}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-caption font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>@ai — Ask AI Assistant</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className={`flex items-center gap-1.5 flex-1 min-w-0 rounded-full px-3.5 py-0.5 border transition-all ${
                /@ai\b/i.test(inputText)
                  ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500/60 ring-2 ring-blue-500/20'
                  : 'bg-apple-secondaryBg dark:bg-white/10 border-apple-border/60 dark:border-white/10 focus-within:ring-2 focus-within:ring-apple-blue'
              }`}>
                {/@ai\b/i.test(inputText) && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold shadow-2xs shrink-0 select-none animate-scale-up">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                    <span>AI Calling</span>
                  </span>
                )}

                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={chatMuted ? "Post as faculty..." : "Type a message or @ai to ask..."}
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
                className={`p-2 rounded-full disabled:opacity-30 text-white transition-all shadow-sm shrink-0 active:scale-95 flex items-center justify-center ${
                  /@ai\b/i.test(inputText)
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-blue-500/30 shadow-md'
                    : 'bg-apple-blue hover:bg-apple-blueHover'
                }`}
                title={/@ai\b/i.test(inputText) ? "Ask AI Assistant" : "Send message"}
              >
                {/@ai\b/i.test(inputText) ? <Sparkles className="w-3.5 h-3.5 text-amber-300" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
