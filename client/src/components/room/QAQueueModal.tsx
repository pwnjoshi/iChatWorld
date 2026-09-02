import React, { useState } from 'react';
import { QAQuestion, QAAnswer } from '../../types/index.js';
import { Modal } from '../common/Modal.js';
import { formatTime } from '../../utils/format.js';
import {
  HelpCircle,
  ThumbsUp,
  CheckCircle2,
  User,
  UserX,
  Send,
  MessageCircle,
  Edit3,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface QAQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QAQuestion[];
  currentSocketId?: string;
  isFaculty: boolean;
  onAskQuestion: (text: string, isAnonymous: boolean) => Promise<boolean>;
  onEditQuestion?: (questionId: string, text: string) => Promise<boolean>;
  onDeleteQuestion?: (questionId: string) => Promise<boolean>;
  onAnswerQuestion?: (questionId: string, text: string) => Promise<boolean>;
  onUpvoteQuestion: (questionId: string) => Promise<boolean>;
  onUpvoteAnswer?: (questionId: string, answerId: string) => Promise<boolean>;
  onToggleAnswer: (questionId: string) => Promise<boolean>;
}

export const QAQueueModal: React.FC<QAQueueModalProps> = ({
  isOpen,
  onClose,
  questions,
  currentSocketId,
  isFaculty,
  onAskQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onAnswerQuestion,
  onUpvoteQuestion,
  onUpvoteAnswer,
  onToggleAnswer
}) => {
  const [inputText, setInputText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [filter, setFilter] = useState<'top' | 'latest' | 'unanswered'>('top');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expanded replies state
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  // Reply input state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  // Edit question state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  if (!isOpen) return null;

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onAskQuestion(inputText.trim(), isAnonymous);
    setIsSubmitting(false);

    if (success) {
      setInputText('');
    }
  };

  const handleStartEdit = (q: QAQuestion) => {
    setEditingQuestionId(q.id);
    setEditText(q.text);
  };

  const handleSaveEdit = async (questionId: string) => {
    if (!editText.trim() || !onEditQuestion) return;
    await onEditQuestion(questionId, editText.trim());
    setEditingQuestionId(null);
    setEditText('');
  };

  const handleSendAnswer = async (questionId: string) => {
    if (!replyText.trim() || !onAnswerQuestion) return;
    await onAnswerQuestion(questionId, replyText.trim());
    setReplyText('');
    setReplyingToId(null);
    setExpandedReplies(prev => ({ ...prev, [questionId]: true }));
  };

  const toggleReplies = (questionId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    if (filter === 'top') {
      return b.upvotes.length - a.upvotes.length;
    }
    if (filter === 'unanswered') {
      const aAns = a.isAnswered || (a.answers && a.answers.length > 0);
      const bAns = b.isAnswered || (b.answers && b.answers.length > 0);
      if (aAns === bAns) return b.upvotes.length - a.upvotes.length;
      return aAns ? 1 : -1;
    }
    return b.timestamp - a.timestamp;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Classroom Q&A & Discussion" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Ask Question Form */}
        <form onSubmit={handleSubmitQuestion} className="p-3 bg-apple-secondaryBg dark:bg-white/5 rounded-ios-card space-y-2 border border-apple-border/50 dark:border-white/10">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question about the lecture or exercise..."
            maxLength={250}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1C1C1E] rounded-ios-input text-footnote text-apple-textPrimary dark:text-white outline-none border border-apple-border dark:border-white/10 focus:ring-2 focus:ring-apple-blue"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 cursor-pointer text-caption text-apple-textSecondary dark:text-white/60 select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-3.5 h-3.5 accent-apple-blue rounded"
              />
              {isAnonymous ? <UserX className="w-3.5 h-3.5 text-amber-500" /> : <User className="w-3.5 h-3.5" />}
              <span>Ask anonymously</span>
            </label>

            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting}
              className="py-1.5 px-4 rounded-full bg-apple-blue hover:bg-apple-blueHover disabled:opacity-40 text-white font-semibold text-caption transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3 h-3" />
              <span>Post Question</span>
            </button>
          </div>
        </form>

        {/* Filter Toolbar */}
        <div className="flex items-center justify-between pb-1 border-b border-apple-border/50 dark:border-white/10">
          <span className="text-caption font-semibold uppercase text-apple-textSecondary dark:text-white/60">
            Questions ({questions.length})
          </span>
          <div className="flex gap-1">
            {(['top', 'latest', 'unanswered'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-full text-caption capitalize font-medium transition-colors ${
                  filter === f
                    ? 'bg-apple-blue text-white'
                    : 'bg-apple-secondaryBg dark:bg-white/10 text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {sortedQuestions.length === 0 ? (
            <div className="text-center py-8 text-apple-textSecondary dark:text-white/40">
              <HelpCircle className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <p className="text-footnote font-medium text-apple-textPrimary dark:text-white">No questions yet</p>
              <p className="text-caption">Post a question above or participate in discussions.</p>
            </div>
          ) : (
            sortedQuestions.map((q) => {
              const isAuthor = currentSocketId && q.authorId === currentSocketId;
              const hasUpvoted = currentSocketId && q.upvotes.includes(currentSocketId);
              const answers = q.answers || [];
              const isResolved = q.isAnswered || answers.length > 0;
              const showReplies = expandedReplies[q.id] || replyingToId === q.id;

              return (
                <div
                  key={q.id}
                  className={`p-3.5 rounded-ios-card border space-y-2.5 transition-all ${
                    isResolved
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60'
                      : 'bg-white dark:bg-[#1C1C1E] border-apple-border/70 dark:border-white/10 shadow-sm'
                  }`}
                >
                  {/* Question Header & Content */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      {editingQuestionId === q.id ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-3 py-1.5 bg-apple-secondaryBg dark:bg-white/10 rounded-lg text-footnote text-apple-textPrimary dark:text-white outline-none border border-apple-blue"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingQuestionId(null)}
                              className="px-2 py-0.5 text-caption text-apple-textSecondary"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(q.id)}
                              className="px-3 py-0.5 rounded-full bg-apple-blue text-white text-caption font-semibold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-footnote font-medium text-apple-textPrimary dark:text-white leading-relaxed">
                          {q.text} {q.isEdited && <span className="text-[11px] text-apple-textSecondary italic">(edited)</span>}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-caption text-apple-textSecondary dark:text-white/60">
                        <span>{q.authorName}</span>
                        <span>•</span>
                        <span>{formatTime(q.timestamp)}</span>
                        {isResolved && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded-full">
                            {answers.length > 0 ? `${answers.length} Answer${answers.length > 1 ? 's' : ''}` : 'Answered'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Upvote & Edit */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isAuthor && editingQuestionId !== q.id && (
                        <button
                          onClick={() => handleStartEdit(q)}
                          className="p-1.5 rounded-full hover:bg-apple-secondaryBg dark:hover:bg-white/10 text-apple-textSecondary hover:text-apple-blue transition-colors"
                          title="Edit Question"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onUpvoteQuestion(q.id)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-caption font-semibold transition-all ${
                          hasUpvoted
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-apple-blue text-apple-blue'
                            : 'bg-apple-secondaryBg dark:bg-white/10 border-apple-border/50 dark:border-white/10 text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white'
                        }`}
                        title="Upvote question"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{q.upvotes.length}</span>
                      </button>

                      {isFaculty && (
                        <button
                          onClick={() => onToggleAnswer(q.id)}
                          className={`p-1.5 rounded-full border transition-colors ${
                            q.isAnswered
                              ? 'bg-emerald-500 border-emerald-600 text-white'
                              : 'bg-apple-secondaryBg dark:bg-white/10 border-apple-border/50 text-apple-textSecondary hover:text-apple-green'
                          }`}
                          title={q.isAnswered ? 'Mark as Unanswered' : 'Mark as Resolved'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Thread Actions Bar: Answer Button & View Answers */}
                  <div className="flex items-center justify-between pt-1 border-t border-apple-border/40 dark:border-white/5 text-caption">
                    <button
                      onClick={() => setReplyingToId(replyingToId === q.id ? null : q.id)}
                      className="flex items-center gap-1 text-apple-blue font-semibold hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{replyingToId === q.id ? 'Cancel Reply' : 'Answer Question'}</span>
                    </button>

                    {answers.length > 0 && (
                      <button
                        onClick={() => toggleReplies(q.id)}
                        className="flex items-center gap-1 text-apple-textSecondary hover:text-apple-textPrimary dark:hover:text-white"
                      >
                        <span>{answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}</span>
                        {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Answer Input Box */}
                  {replyingToId === q.id && (
                    <div className="p-2.5 bg-apple-secondaryBg/80 dark:bg-white/10 rounded-xl space-y-2 animate-fade-in">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your answer or explanation here..."
                        autoFocus
                        className="w-full px-3 py-2 bg-white dark:bg-[#1C1C1E] rounded-lg text-footnote text-apple-textPrimary dark:text-white outline-none border border-apple-border focus:ring-1 focus:ring-apple-blue"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setReplyingToId(null)}
                          className="px-3 py-1 text-caption text-apple-textSecondary hover:text-apple-textPrimary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendAnswer(q.id)}
                          disabled={!replyText.trim()}
                          className="px-3.5 py-1 rounded-full bg-apple-green hover:bg-emerald-600 disabled:opacity-40 text-white text-caption font-semibold flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Post Answer</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Threaded Answers List */}
                  {showReplies && answers.length > 0 && (
                    <div className="space-y-2 pl-3 border-l-2 border-apple-blue/40 pt-1">
                      {answers.map((ans) => {
                        const hasUpvotedAns = currentSocketId && ans.upvotes.includes(currentSocketId);
                        return (
                          <div
                            key={ans.id}
                            className="p-2.5 rounded-xl bg-apple-secondaryBg/60 dark:bg-white/5 border border-apple-border/40 dark:border-white/5 flex items-start justify-between gap-2"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <p className="text-footnote text-apple-textPrimary dark:text-white">
                                {ans.text}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-apple-textSecondary dark:text-white/60">
                                <span className="font-semibold text-apple-textPrimary dark:text-white">{ans.authorName}</span>
                                {ans.isFaculty && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                                    Faculty
                                  </span>
                                )}
                                <span>•</span>
                                <span>{formatTime(ans.timestamp)}</span>
                              </div>
                            </div>

                            {onUpvoteAnswer && (
                              <button
                                onClick={() => onUpvoteAnswer(q.id, ans.id)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-caption font-semibold transition-all border ${
                                  hasUpvotedAns
                                    ? 'bg-blue-50 border-apple-blue text-apple-blue'
                                    : 'bg-white dark:bg-[#1C1C1E] border-apple-border/40 text-apple-textSecondary'
                                }`}
                                title="Upvote Answer"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{ans.upvotes.length}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
