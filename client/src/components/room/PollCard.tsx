import React from 'react';
import { Poll } from '../../types/index.js';
import { BarChart2, Check, Lock, Trash2 } from 'lucide-react';

interface PollCardProps {
  poll: Poll;
  currentSocketId?: string;
  isFaculty?: boolean;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  onClosePoll: (pollId: string) => Promise<boolean>;
  onDeletePoll?: (pollId: string) => Promise<boolean>;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  currentSocketId,
  isFaculty,
  onVote,
  onClosePoll,
  onDeletePoll
}) => {
  const userVotedOption = poll.options.find(opt => currentSocketId && opt.votes.includes(currentSocketId));
  const isCreator = currentSocketId && poll.creatorId === currentSocketId;
  const canManage = isFaculty || isCreator;

  const handleDelete = () => {
    if (onDeletePoll && window.confirm('Delete this poll from the room?')) {
      onDeletePoll(poll.id);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-ios-card p-4 border border-apple-border/70 dark:border-white/10 shadow-ios-card space-y-3 my-2">
      {/* Poll Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-apple-blue">
          <BarChart2 className="w-4 h-4 shrink-0" />
          <span className="text-caption font-semibold uppercase tracking-wider">
            Live Poll {poll.isOpen ? '' : '(Closed)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canManage && poll.isOpen && (
            <button
              onClick={() => onClosePoll(poll.id)}
              className="text-caption font-semibold text-apple-textSecondary hover:text-apple-red transition-colors flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>End</span>
            </button>
          )}

          {canManage && onDeletePoll && (
            <button
              onClick={handleDelete}
              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-apple-textSecondary hover:text-apple-red transition-colors"
              title="Delete Poll"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Question */}
      <h4 className="text-subhead font-semibold text-apple-textPrimary dark:text-white">
        {poll.question}
      </h4>

      {/* Options & Results */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const voteCount = opt.votes.length;
          const percentage = poll.totalVotes > 0
            ? Math.round((voteCount / poll.totalVotes) * 100)
            : 0;
          const isSelected = userVotedOption?.id === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => {
                if (poll.isOpen) {
                  onVote(poll.id, opt.id);
                }
              }}
              className={`relative overflow-hidden rounded-xl border p-2.5 transition-all select-none ${
                poll.isOpen ? 'cursor-pointer hover:border-apple-blue/60' : 'cursor-default'
              } ${
                isSelected
                  ? 'border-apple-blue bg-blue-50/40 dark:bg-blue-950/30'
                  : 'border-apple-border/60 dark:border-white/10 bg-apple-secondaryBg/40 dark:bg-white/5'
              }`}
            >
              {/* Animated Progress Bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 transition-all duration-300 ${
                  isSelected ? 'bg-apple-blue/20 dark:bg-apple-blue/30' : 'bg-apple-secondaryBg dark:bg-white/10'
                }`}
                style={{ width: `${percentage}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between z-10 text-footnote">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-apple-blue bg-apple-blue text-white'
                        : 'border-apple-border dark:border-white/20 bg-white dark:bg-[#1C1C1E]'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span className={`font-medium ${isSelected ? 'text-apple-blue font-semibold' : 'text-apple-textPrimary dark:text-white'}`}>
                    {opt.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-caption font-semibold text-apple-textSecondary dark:text-white/60">
                  <span>{percentage}%</span>
                  <span className="text-[11px] font-normal">({voteCount})</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Details */}
      <div className="flex items-center justify-between text-caption text-apple-textSecondary dark:text-white/50 pt-1 border-t border-apple-border/40 dark:border-white/10">
        <span>By {poll.creatorName}</span>
        <span>{poll.totalVotes} total {poll.totalVotes === 1 ? 'vote' : 'votes'}</span>
      </div>
    </div>
  );
};
