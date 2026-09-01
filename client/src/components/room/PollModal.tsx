import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Plus, Trash2, BarChart2 } from 'lucide-react';

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (question: string, options: string[]) => Promise<boolean>;
}

export const PollModal: React.FC<PollModalProps> = ({ isOpen, onClose, onCreatePoll }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['Yes', 'No']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = question.trim();
    const cleanOpts = options.map(o => o.trim()).filter(o => o.length > 0);

    if (!cleanQ) {
      setError('Please enter a poll question');
      return;
    }
    if (cleanOpts.length < 2) {
      setError('Please provide at least 2 valid options');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const success = await onCreatePoll(cleanQ, cleanOpts);
    setIsSubmitting(false);

    if (success) {
      setQuestion('');
      setOptions(['Yes', 'No']);
      onClose();
    } else {
      setError('Failed to create poll');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Classroom Poll">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-footnote font-medium text-apple-textSecondary mb-1.5">
            Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setError('');
            }}
            placeholder="e.g. Did everyone finish Exercise 3?"
            autoFocus
            maxLength={140}
            className="w-full px-3.5 py-2.5 bg-apple-secondaryBg rounded-ios-input text-body text-apple-textPrimary placeholder:text-apple-textSecondary/50 outline-none focus:ring-2 focus:ring-apple-blue"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-footnote font-medium text-apple-textSecondary">
            Options
          </label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-caption font-semibold text-apple-textSecondary w-4 text-center">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                maxLength={60}
                className="flex-1 px-3 py-2 bg-apple-secondaryBg rounded-ios-input text-footnote text-apple-textPrimary placeholder:text-apple-textSecondary/50 outline-none focus:ring-2 focus:ring-apple-blue"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  className="p-1.5 text-apple-textSecondary hover:text-apple-red rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {options.length < 6 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="text-footnote font-medium text-apple-blue hover:text-apple-blueHover flex items-center gap-1.5 pt-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Option</span>
            </button>
          )}
        </div>

        {error && (
          <p className="text-footnote text-apple-red font-medium">{error}</p>
        )}

        <div className="flex gap-2 pt-3 border-t border-apple-border/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-full bg-apple-secondaryBg text-apple-textPrimary font-medium text-footnote hover:bg-apple-tertiaryBg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-full bg-apple-blue text-white font-semibold text-footnote hover:bg-apple-blueHover transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <BarChart2 className="w-4 h-4" />
            <span>Launch Poll</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
