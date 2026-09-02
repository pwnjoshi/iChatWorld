import React, { useState } from 'react';
import {
  Star,
  GitFork,
  Code2,
  Cpu,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  Heart,
  X,
  MessageSquare,
  Clock,
  BarChart2,
} from 'lucide-react';

interface DeveloperDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperDocsModal: React.FC<DeveloperDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'architecture' | 'contribute'>('overview');
  const [copiedClone, setCopiedClone] = useState(false);

  if (!isOpen) return null;

  const handleCopyClone = () => {
    navigator.clipboard.writeText('git clone https://github.com/pwnjoshi/iChatWorld.git');
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  const tabs = [
    { id: 'overview' as const, label: 'Guide', icon: <BookOpen className="w-4 h-4" />, color: 'bg-apple-blue' },
    { id: 'ai' as const, label: '@ai', icon: <Sparkles className="w-4 h-4" />, color: 'bg-purple-600' },
    { id: 'architecture' as const, label: 'Tech', icon: <Cpu className="w-4 h-4" />, color: 'bg-apple-blue' },
    { id: 'contribute' as const, label: 'Contribute', icon: <Code2 className="w-4 h-4" />, color: 'bg-emerald-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:justify-center sm:items-center sm:p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] z-10 border-t sm:border border-apple-border/60 dark:border-white/15 animate-slide-up sm:animate-scale-up overflow-hidden">

        {/* ── Mobile grab handle ── */}
        <div className="w-10 h-1 bg-apple-border/80 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-apple-border/40 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#3a8ef9] to-[#1a6ee0] shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,_0_3px_8px_rgba(26,110,224,0.4)] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-body font-bold text-apple-textPrimary dark:text-white leading-tight">Developer Docs</h3>
              <p className="text-[11px] text-apple-textSecondary dark:text-white/50 leading-tight hidden sm:block">iChatWorld Platform Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 text-apple-textSecondary dark:text-white/80 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── GitHub Banner ── */}
        <div className="px-4 sm:px-6 pt-3 pb-2 shrink-0">
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black border border-white/10">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded-full bg-apple-blue text-white text-[10px] font-bold uppercase tracking-wider">Open Source</span>
                <span className="text-white/50 text-[11px]">MIT</span>
              </div>
              <p className="text-white font-bold text-footnote leading-tight">iChatWorld on GitHub</p>
              <p className="text-white/50 text-[11px] mt-0.5 hidden sm:block">Star, fork, or contribute to the project!</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://github.com/pwnjoshi/iChatWorld"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-[13px] select-none
                  text-white
                  bg-gradient-to-b from-[#3a8ef9] to-[#1a6ee0]
                  shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,_0_3px_8px_rgba(26,110,224,0.4)]
                  hover:from-[#4a96ff] hover:to-[#2176e8]
                  active:scale-95 transition-all"
              >
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>Star</span>
              </a>
              <a
                href="https://github.com/pwnjoshi/iChatWorld/fork"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-[13px] transition-all active:scale-95 border border-white/10"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fork</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pb-2 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? `${tab.color} text-white shadow-sm`
                  : 'text-apple-textSecondary dark:text-white/60 hover:text-apple-textPrimary dark:hover:text-white hover:bg-apple-secondaryBg dark:hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-3 no-scrollbar">

          {/* TAB 1: Platform Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              {/* Feature cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { icon: <Shield className="w-4 h-4" />, color: 'text-apple-blue bg-blue-50 dark:bg-blue-950/40', title: 'Zero Login & Ephemeral', desc: 'Rooms exist purely in memory and self-destruct after inactivity. No accounts, passwords, or persistent tracking required.' },
                  { icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40', title: 'In-Room @ai Assistant', desc: 'Type @ai <question> in chat for real-time explanations, quizzes, and code debugging powered by DeepSeek.' },
                  { icon: <Layers className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40', title: 'Collaborative Whiteboard', desc: 'Double-buffered Bézier rendering with 0 spikes, Light / Dark / Math Grid canvas themes, and 1-tap broadcast.' },
                  { icon: <Cpu className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40', title: 'Slide Presenter & Laser', desc: 'Multi-peer sync, pen & highlighter markup, and real-time red laser pointer dot tracking.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-3.5 rounded-2xl bg-apple-secondaryBg dark:bg-white/5 border border-apple-border/50 dark:border-white/10">
                    <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[13px] text-apple-textPrimary dark:text-white leading-tight">{item.title}</p>
                      <p className="text-[12px] text-apple-textSecondary dark:text-white/60 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checklist */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-apple-border/70 dark:border-white/10">
                <h4 className="font-bold text-[13px] text-apple-textPrimary dark:text-white mb-2.5">All Studio Capabilities</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                  {[
                    'Echo-Cancelled Voice Messages',
                    'Synchronized Focus Timer & Presets',
                    'Live Polls with 1-Tap Deletion',
                    'Anonymous Upvotable Q&A Queue',
                    'OTP Verified Notes & Homework Export',
                    'Draggable Floating Screen Share PiP',
                    'Direct WebRTC P2P File Transfers',
                    'Host Passphrase Moderation',
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-[12px] text-apple-textSecondary dark:text-white/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-apple-green shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: @ai Guide */}
          {activeTab === 'ai' && (
            <div className="space-y-3">
              <div className="flex gap-3 p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <div className="w-9 h-9 rounded-xl bg-purple-600 shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,_0_3px_8px_rgba(147,51,234,0.4)] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-[14px] text-purple-900 dark:text-purple-200">In-Room @ai Assistant</p>
                  <p className="text-[13px] text-purple-800 dark:text-purple-300/80 mt-1 leading-relaxed">
                    Mention <code className="px-1.5 py-0.5 bg-purple-200/60 dark:bg-purple-900/60 font-mono rounded font-bold text-[12px]">@ai</code> in any chat message to trigger the built-in AI teaching assistant powered by DeepSeek-V4.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-[13px] text-apple-textPrimary dark:text-white px-1">Example Prompts</p>
                {[
                  'Explain the difference between BFS and DFS with an analogy',
                  'Quiz me on Big-O complexity of quicksort',
                  'What features does iChatWorld have for classroom teaching?',
                  'Debug this React hook: useEffect(() => fetchData(), [])',
                ].map((prompt, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-apple-secondaryBg dark:bg-white/5 rounded-xl border border-apple-border/40 dark:border-white/10 font-mono text-[12px]">
                    <span className="text-purple-600 dark:text-purple-400 font-bold shrink-0">@ai</span>
                    <span className="text-apple-textPrimary dark:text-white/80 leading-relaxed">{prompt}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[13px] text-amber-900 dark:text-amber-300">Built-in Rate Limits</p>
                  <p className="text-[12px] text-amber-800 dark:text-amber-400/80 mt-0.5">6 queries/min per user · 40 queries/hour per room. Ensures fair classroom usage.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Architecture */}
          {activeTab === 'architecture' && (
            <div className="space-y-3">
              <div className="p-4 bg-apple-secondaryBg dark:bg-white/5 rounded-2xl border border-apple-border/60 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-apple-blue/10 dark:bg-apple-blue/20 flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5 text-apple-blue" />
                  </div>
                  <h4 className="font-bold text-[14px] text-apple-textPrimary dark:text-white">Mesh Networking & WebRTC</h4>
                </div>
                <p className="text-[13px] text-apple-textSecondary dark:text-white/70 leading-relaxed">
                  Direct end-to-end encrypted WebRTC DataChannels between room participants. Files stream at full gigabit speeds with 0 KB passing through server disks. Ephemeral 15-minute chunk relay as fallback for symmetric NATs.
                </p>
              </div>

              <div className="p-4 bg-apple-secondaryBg dark:bg-white/5 rounded-2xl border border-apple-border/60 dark:border-white/10 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                    <FileCode className="w-3.5 h-3.5 text-apple-green" />
                  </div>
                  <h4 className="font-bold text-[14px] text-apple-textPrimary dark:text-white">Socket.IO Events</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    'room:create / join',
                    'chat:send (@ai trigger)',
                    'whiteboard:draw / clear',
                    'presenter:sync / laser',
                    'poll:create / vote / delete',
                    'qa:ask / answer / upvote',
                    'timer:start / pause / reset',
                    'file:broadcast / relay',
                  ].map((evt, i) => (
                    <code key={i} className="block px-2.5 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg font-mono text-[12px] text-apple-textPrimary dark:text-white/80 border border-apple-border/30 dark:border-white/5">
                      {evt}
                    </code>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-apple-secondaryBg dark:bg-white/5 rounded-2xl border border-apple-border/60 dark:border-white/10">
                <h4 className="font-bold text-[14px] text-apple-textPrimary dark:text-white mb-2.5">Tech Stack</h4>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  {[
                    ['Frontend', 'React 18 + Vite + TypeScript'],
                    ['Styling', 'Tailwind CSS v3'],
                    ['Realtime', 'Socket.IO 4 + WebSocket'],
                    ['Server', 'Node.js + Express'],
                    ['Infra', 'PM2 + Nginx + EC2'],
                    ['AI', 'DeepSeek-V4 via Nebius'],
                  ].map(([label, val], i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-apple-textSecondary dark:text-white/40 font-semibold uppercase tracking-wide text-[10px]">{label}</span>
                      <span className="text-apple-textPrimary dark:text-white font-medium leading-tight mt-0.5">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Contribute */}
          {activeTab === 'contribute' && (
            <div className="space-y-3">
              <div className="flex gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,_0_3px_8px_rgba(5,150,105,0.4)] flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <p className="font-bold text-[14px] text-emerald-900 dark:text-emerald-200">Join the Community</p>
                  <p className="text-[13px] text-emerald-800 dark:text-emerald-300/80 mt-0.5">Students, educators & developers worldwide are welcome!</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[13px] text-apple-textPrimary dark:text-white px-1">Quick Setup</h4>
                <div className="rounded-2xl bg-[#0d1117] border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                    <span className="text-white/40 text-[11px] font-mono">bash</span>
                    <button
                      onClick={handleCopyClone}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-[12px] font-medium transition-colors active:scale-95"
                    >
                      {copiedClone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedClone ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-4 space-y-2 font-mono text-[13px]">
                    <p><span className="text-white/40"># 1. Clone repository</span></p>
                    <p className="text-emerald-400">git clone https://github.com/pwnjoshi/iChatWorld.git</p>
                    <p className="mt-2"><span className="text-white/40"># 2. Install dependencies</span></p>
                    <p className="text-emerald-400">npm install</p>
                    <p className="mt-2"><span className="text-white/40"># 3. Start dev server</span></p>
                    <p className="text-emerald-400">npm run dev</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-apple-secondaryBg dark:bg-white/5 border border-apple-border/60 dark:border-white/10">
                <div>
                  <p className="text-[12px] text-apple-textSecondary dark:text-white/50">Repository</p>
                  <p className="font-semibold text-[13px] text-apple-textPrimary dark:text-white">github.com/pwnjoshi/iChatWorld</p>
                </div>
                <a
                  href="https://github.com/pwnjoshi/iChatWorld"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-[13px] select-none
                    text-white
                    bg-gradient-to-b from-[#3a8ef9] to-[#1a6ee0]
                    shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,_0_3px_8px_rgba(26,110,224,0.4)]
                    hover:from-[#4a96ff] hover:to-[#2176e8]
                    active:scale-95 transition-all"
                >
                  <span>Open Repo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
