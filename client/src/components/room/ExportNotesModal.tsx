import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { RoomState, Member } from '../../types/index.js';
import { formatFileSize } from '../../utils/format.js';
import { getApiUrl } from '../../config.js';
import {
  Mail,
  Download,
  CheckCircle2,
  FileText,
  PenTool,
  Folder,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  RotateCcw
} from 'lucide-react';

interface ExportNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomState;
  currentMember: Member | null;
}

export const ExportNotesModal: React.FC<ExportNotesModalProps> = ({
  isOpen,
  onClose,
  room,
  currentMember
}) => {
  const [activeTab, setActiveTab] = useState<'email' | 'download'>('email');

  // Export selection options
  const [includeCustomNotes, setIncludeCustomNotes] = useState(true);
  const [customNotes, setCustomNotes] = useState('');
  const [includeWhiteboard, setIncludeWhiteboard] = useState(room.whiteboardStrokes && room.whiteboardStrokes.length > 0);
  const [includeFiles, setIncludeFiles] = useState(room.files && room.files.length > 0);
  const [includeQA, setIncludeQA] = useState(room.qaQuestions && room.qaQuestions.length > 0);

  // Email OTP state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enter_email' | 'enter_otp' | 'success'>('enter_email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);

  if (!isOpen) return null;

  // Render Whiteboard strokes to base64 PNG data URL
  const generateWhiteboardBase64 = (): string | undefined => {
    if (!room.whiteboardStrokes || room.whiteboardStrokes.length === 0) return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Solid white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of room.whiteboardStrokes) {
      const points = stroke.points;
      if (!points || points.length === 0) continue;

      ctx.save();
      if (stroke.type === 'eraser') {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = stroke.size * 3;
      } else if (stroke.type === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
      }

      if (stroke.type === 'rect' && points.length >= 2) {
        const start = points[0];
        const end = points[points.length - 1];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (stroke.type === 'circle' && points.length >= 2) {
        const start = points[0];
        const end = points[points.length - 1];
        const radius = Math.hypot(end.x - start.x, end.y - start.y);
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (stroke.type === 'line' && points.length >= 2) {
        const start = points[0];
        const end = points[points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (points.length === 1) {
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, Math.max(1, stroke.size / 2), 0, 2 * Math.PI);
        ctx.fillStyle = stroke.type === 'eraser' ? '#FFFFFF' : stroke.color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
      }
      ctx.restore();
    }

    return canvas.toDataURL('image/png');
  };

  // Step 1: Request 6-digit OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(getApiUrl('/api/email/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send OTP code.');
      } else {
        setStep('enter_otp');
        setIsSimulated(!!data.isSimulated);
        setStatusMsg(data.isSimulated ? 'Dev mode: OTP code printed in server console.' : 'Verification code sent to your inbox!');
      }
    } catch (err: any) {
      setError('Network error connecting to email service.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Dispatch Notes
  const handleVerifyAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const whiteboardBase64 = includeWhiteboard ? generateWhiteboardBase64() : undefined;
      const filesList = includeFiles
        ? (room.files || []).map((f) => ({
            filename: f.filename,
            sizeFormatted: formatFileSize(f.size),
            uploaderName: f.senderName || 'Anonymous'
          }))
        : undefined;

      const qaSummary = includeQA
        ? (room.qaQuestions || []).map((q) => ({
            question: q.text,
            author: q.isAnonymous ? 'Anonymous' : q.authorName,
            answer: q.answers && q.answers.length > 0 ? q.answers.map((a) => a.text).join('; ') : undefined
          }))
        : undefined;

      const res = await fetch(getApiUrl('/api/email/verify-and-send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          roomCode: room.code,
          customMessage: includeCustomNotes ? customNotes : undefined,
          whiteboardBase64,
          filesList,
          qaSummary
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to verify OTP.');
      } else {
        setStep('success');
        setStatusMsg('Notes and homework package delivered to your email!');
      }
    } catch (err: any) {
      setError('Network error dispatching notes package.');
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Download Markdown Bundle
  const handleDownloadMarkdown = () => {
    let md = `# iChatWorld Session Package — Room ${room.code}\n`;
    md += `*Generated on ${new Date().toLocaleString()}*\n\n---\n\n`;

    if (includeCustomNotes && customNotes.trim()) {
      md += `## 📝 Homework & Notes\n\n${customNotes.trim()}\n\n---\n\n`;
    }

    if (includeFiles && room.files && room.files.length > 0) {
      md += `## 📁 Shared Files (${room.files.length})\n\n`;
      room.files.forEach((f) => {
        md += `- **${f.filename}** (${formatFileSize(f.size)}) — Uploaded by ${f.senderName || 'Anonymous'}\n`;
      });
      md += `\n---\n\n`;
    }

    if (includeQA && room.qaQuestions && room.qaQuestions.length > 0) {
      md += `## ❓ Q&A Key Takeaways (${room.qaQuestions.length})\n\n`;
      room.qaQuestions.forEach((q) => {
        md += `### Q: ${q.text} *(by ${q.isAnonymous ? 'Anonymous' : q.authorName})*\n`;
        if (q.answers && q.answers.length > 0) {
          q.answers.forEach((a) => {
            md += `> **A:** ${a.text} *(by ${a.authorName})*\n`;
          });
        } else {
          md += `*No answer provided.*\n`;
        }
        md += `\n`;
      });
      md += `---\n\n`;
    }

    md += `*iChatWorld — Zero-login ephemeral peer-to-peer workspace*\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-room-${room.code}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Notes & Homework" maxWidth="max-w-xl">
      <div className="space-y-4 select-none">
        {/* Top Segmented Tabs: Email vs Download */}
        <div className="flex p-0.5 bg-apple-secondaryBg dark:bg-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-footnote font-semibold transition-all ${
              activeTab === 'email'
                ? 'bg-white dark:bg-[#1C1C1E] text-apple-textPrimary dark:text-white shadow-sm'
                : 'text-apple-textSecondary dark:text-white/60 hover:text-apple-textPrimary dark:hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 text-apple-blue" />
            <span>Send to My Email</span>
          </button>
          <button
            onClick={() => setActiveTab('download')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-footnote font-semibold transition-all ${
              activeTab === 'download'
                ? 'bg-white dark:bg-[#1C1C1E] text-apple-textPrimary dark:text-white shadow-sm'
                : 'text-apple-textSecondary dark:text-white/60 hover:text-apple-textPrimary dark:hover:text-white'
            }`}
          >
            <Download className="w-4 h-4 text-apple-green" />
            <span>Download .MD File</span>
          </button>
        </div>

        {/* Content Selection Checklist */}
        <div className="p-3.5 bg-apple-secondaryBg/70 dark:bg-white/5 rounded-2xl border border-apple-border/50 dark:border-white/10 space-y-3">
          <span className="text-caption font-bold uppercase tracking-wider text-apple-textSecondary dark:text-white/50 block">
            Select Content to Include
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-footnote">
            {/* Custom Notes */}
            <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border/40 dark:border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCustomNotes}
                onChange={(e) => setIncludeCustomNotes(e.target.checked)}
                className="w-4 h-4 accent-apple-blue rounded"
              />
              <FileText className="w-4 h-4 text-apple-blue shrink-0" />
              <span className="font-medium text-apple-textPrimary dark:text-white">Custom Notes</span>
            </label>

            {/* Whiteboard Snapshot */}
            <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border/40 dark:border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWhiteboard}
                onChange={(e) => setIncludeWhiteboard(e.target.checked)}
                className="w-4 h-4 accent-apple-blue rounded"
              />
              <PenTool className="w-4 h-4 text-apple-blue shrink-0" />
              <span className="font-medium text-apple-textPrimary dark:text-white">Whiteboard PNG</span>
            </label>

            {/* Shared Files List */}
            <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border/40 dark:border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeFiles}
                onChange={(e) => setIncludeFiles(e.target.checked)}
                className="w-4 h-4 accent-apple-blue rounded"
              />
              <Folder className="w-4 h-4 text-apple-blue shrink-0" />
              <span className="font-medium text-apple-textPrimary dark:text-white">
                Files List ({room.files ? room.files.length : 0})
              </span>
            </label>

            {/* Q&A Summary */}
            <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border/40 dark:border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQA}
                onChange={(e) => setIncludeQA(e.target.checked)}
                className="w-4 h-4 accent-apple-blue rounded"
              />
              <HelpCircle className="w-4 h-4 text-apple-blue shrink-0" />
              <span className="font-medium text-apple-textPrimary dark:text-white">
                Q&A Summary ({room.qaQuestions ? room.qaQuestions.length : 0})
              </span>
            </label>
          </div>

          {/* Custom Notes / Homework Write-up Field */}
          {includeCustomNotes && (
            <div className="space-y-1 pt-1 animate-fade-in">
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Type your homework write-up, action items, or assignment details here..."
                rows={3}
                className="w-full px-3 py-2.5 bg-white dark:bg-[#1C1C1E] rounded-xl text-footnote text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/50 dark:placeholder:text-white/30 outline-none border border-apple-border dark:border-white/10 focus:border-apple-blue transition-all resize-none"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Email via OTP Dispatch */}
        {activeTab === 'email' && (
          <div className="space-y-3 pt-1">
            {step === 'enter_email' && (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <div>
                  <label className="block text-footnote font-medium text-apple-textSecondary dark:text-white/70 mb-1.5">
                    Your Target Email Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="student@example.com"
                      autoFocus
                      className="flex-1 px-4 py-2.5 bg-apple-secondaryBg dark:bg-white/10 rounded-xl text-body text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/50 dark:placeholder:text-white/30 outline-none border border-apple-border/50 dark:border-white/10 focus:border-apple-blue transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !email.trim() || !email.includes('@')}
                      className="px-5 py-2.5 rounded-xl bg-apple-blue hover:bg-apple-blueHover disabled:opacity-30 text-white font-semibold text-footnote transition-all flex items-center justify-center shrink-0"
                    >
                      {isLoading ? 'Sending...' : 'Send OTP'}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-caption text-apple-textSecondary dark:text-white/50">
                  <ShieldCheck className="w-4 h-4 text-apple-green shrink-0" />
                  <span>A 6-digit OTP code will verify ownership before dispatching notes.</span>
                </div>
              </form>
            )}

            {step === 'enter_otp' && (
              <form onSubmit={handleVerifyAndSend} className="space-y-3 animate-fade-in">
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-footnote">
                  <div className="space-y-0.5">
                    <span className="text-caption font-bold text-apple-blue">OTP Sent To:</span>
                    <p className="font-mono text-apple-textPrimary dark:text-white font-semibold">{email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('enter_email');
                      setOtp('');
                      setError('');
                    }}
                    className="text-caption text-apple-blue hover:underline font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Change</span>
                  </button>
                </div>

                <div>
                  <label className="block text-footnote font-medium text-apple-textSecondary dark:text-white/70 mb-1.5 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                    className="w-full px-4 py-3 bg-apple-secondaryBg dark:bg-white/10 rounded-xl text-headline font-mono font-bold tracking-widest text-center text-apple-textPrimary dark:text-white placeholder:text-apple-textSecondary/40 dark:placeholder:text-white/30 outline-none border border-apple-border/50 dark:border-white/10 focus:border-apple-blue transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.trim().length !== 6}
                  className="w-full py-3 px-4 rounded-xl bg-apple-blue hover:bg-apple-blueHover disabled:opacity-30 text-white font-bold text-footnote transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>{isLoading ? 'Delivering...' : 'Verify & Send Notes Package'}</span>
                </button>
              </form>
            )}

            {step === 'success' && (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 text-center space-y-3 animate-scale-up">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <div>
                  <h4 className="text-headline font-bold text-emerald-900 dark:text-emerald-200">
                    Package Delivered!
                  </h4>
                  <p className="text-footnote text-emerald-800/80 dark:text-emerald-300/80 mt-1">
                    Your homework write-up, whiteboard diagram, and file links have been emailed to{' '}
                    <strong>{email}</strong>.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-footnote font-semibold transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Direct Download */}
        {activeTab === 'download' && (
          <div className="space-y-3 pt-2">
            <p className="text-footnote text-apple-textSecondary dark:text-white/70">
              Download your session notes and homework directly as a formatted Markdown (<code className="font-mono text-xs px-1 bg-black/10 dark:bg-white/10 rounded">.md</code>) document on your device.
            </p>

            <button
              onClick={handleDownloadMarkdown}
              className="w-full py-3 px-4 rounded-xl bg-apple-blue hover:bg-apple-blueHover text-white font-bold text-footnote transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Markdown Notes Bundle</span>
            </button>
          </div>
        )}

        {error && (
          <p className="text-footnote text-apple-red font-medium text-center animate-shake">
            {error}
          </p>
        )}
        {statusMsg && step !== 'success' && (
          <p className="text-caption text-apple-blue font-medium text-center">
            {statusMsg}
          </p>
        )}
      </div>
    </Modal>
  );
};
