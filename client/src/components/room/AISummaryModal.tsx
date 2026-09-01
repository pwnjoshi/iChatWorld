import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Sparkles, CheckCircle2, ListChecks, HelpCircle, Download, Radio, BookOpen } from 'lucide-react';

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetSummary: () => Promise<any>;
}

export const AISummaryModal: React.FC<AISummaryModalProps> = ({
  isOpen,
  onClose,
  onGetSummary
}) => {
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onGetSummary();
      if (result) {
        setSummaryData(result);
      } else {
        setError('Failed to generate AI summary. Try adding more chat messages or files.');
      }
    } catch (e: any) {
      setError(e.message || 'Error communicating with AI service');
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!summaryData) return;
    const md = `# ${summaryData.title || 'Lecture Summary'}\n\n${summaryData.summary}\n\n## Key Takeaways\n${(summaryData.keyTakeaways || []).map((t: string) => `- ${t}`).join('\n')}\n\n## Action Items\n${(summaryData.actionItems || []).map((a: string) => `- [ ] ${a}`).join('\n')}\n`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture-summary-${Date.now()}.md`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✨ AI Lecture Digest & Summary" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {!summaryData && !loading && (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-headline font-bold text-apple-textPrimary dark:text-white">
                DeepSeek Classroom Synthesizer
              </h3>
              <p className="text-footnote text-apple-textSecondary dark:text-white/60 max-w-md mx-auto">
                Scan all discussion messages, shared files, and student questions from this session to generate a clean structured study guide.
              </p>
            </div>

            {error && (
              <p className="text-footnote text-apple-red font-medium">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              className="py-3 px-6 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white font-semibold text-subhead transition-all shadow-sm hover:shadow flex items-center gap-2 mx-auto active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Session Summary</span>
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 space-y-3 animate-fade-in">
            <Radio className="w-8 h-8 mx-auto text-apple-blue animate-spin" />
            <p className="text-subhead font-semibold text-apple-textPrimary dark:text-white">
              Synthesizing lecture with DeepSeek-V4...
            </p>
            <p className="text-caption text-apple-textSecondary dark:text-white/50">
              Extracting core topics, action items & practice quiz
            </p>
          </div>
        )}

        {summaryData && !loading && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Title & Overview */}
            <div className="p-4 bg-apple-secondaryBg dark:bg-white/5 rounded-ios-card border border-apple-border/60 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-caption font-bold uppercase tracking-wider text-apple-blue flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {summaryData.title || 'Lecture Overview'}
                </span>
                <button
                  onClick={handleExportMarkdown}
                  className="text-caption font-semibold text-apple-textSecondary hover:text-apple-blue flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Save Markdown</span>
                </button>
              </div>
              <p className="text-footnote text-apple-textPrimary dark:text-white/90 leading-relaxed">
                {summaryData.summary}
              </p>
            </div>

            {/* Key Takeaways */}
            {summaryData.keyTakeaways && summaryData.keyTakeaways.length > 0 && (
              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-ios-card border border-blue-200/60 dark:border-blue-900/40 space-y-2">
                <span className="text-caption font-bold uppercase tracking-wider text-apple-blue flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Key Takeaways
                </span>
                <ul className="space-y-1.5 text-footnote text-apple-textPrimary dark:text-white">
                  {summaryData.keyTakeaways.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-apple-blue font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {summaryData.actionItems && summaryData.actionItems.length > 0 && (
              <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-ios-card border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                <span className="text-caption font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5" />
                  Action Items & Deadlines
                </span>
                <ul className="space-y-1.5 text-footnote text-apple-textPrimary dark:text-white">
                  {summaryData.actionItems.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Quiz */}
            {summaryData.suggestedQuiz && summaryData.suggestedQuiz.length > 0 && (
              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-ios-card border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                <span className="text-caption font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Quick Concept Quiz
                </span>
                <div className="space-y-2 text-footnote">
                  {summaryData.suggestedQuiz.map((q: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-white dark:bg-[#1C1C1E] rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                      <p className="font-semibold text-apple-textPrimary dark:text-white">
                        {idx + 1}. {q.question}
                      </p>
                      <div className="mt-1 space-y-1 pl-2">
                        {q.options?.map((opt: string, oIdx: number) => (
                          <div
                            key={oIdx}
                            className={`text-caption ${oIdx === q.correctIndex ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-apple-textSecondary dark:text-white/60'}`}
                          >
                            {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === q.correctIndex ? '✓' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="w-full py-2.5 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg text-apple-textPrimary dark:text-white font-semibold text-footnote transition-colors"
            >
              Re-summarize with Latest Messages
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
