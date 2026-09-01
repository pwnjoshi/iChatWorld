import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
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
  Terminal,
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  Heart
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="iChatWorld Developer & Platform Docs" maxWidth="max-w-4xl">
      <div className="space-y-4">
        {/* GitHub Star Banner Header */}
        <div className="p-5 rounded-2xl bg-apple-secondaryBg dark:bg-white/5 border border-apple-border/70 dark:border-white/10 text-apple-textPrimary dark:text-white shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-apple-blue text-white text-[11px] font-bold uppercase tracking-wider">
                Open Source
              </span>
              <span className="text-apple-textSecondary dark:text-white/60 text-caption font-medium">MIT Licensed</span>
            </div>
            <h3 className="text-headline font-bold text-apple-textPrimary dark:text-white">iChatWorld on GitHub</h3>
            <p className="text-footnote text-apple-textSecondary dark:text-white/70 max-w-lg">
              Support development with a star on GitHub, report issues, or contribute new studio tools!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://github.com/pwnjoshi/iChatWorld"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-2 px-4 rounded-full bg-apple-blue text-white hover:bg-apple-blueHover font-bold text-footnote shadow-sm transition-all active:scale-95"
            >
              <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
              <span>Star on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/80" />
            </a>
            <a
              href="https://github.com/pwnjoshi/iChatWorld/fork"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg text-apple-textPrimary dark:text-white font-semibold text-footnote transition-all active:scale-95 border border-apple-border/60 dark:border-white/10"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Fork</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-apple-border/70 dark:border-white/10 pb-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-footnote font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'overview'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'text-apple-textSecondary dark:text-white/60 hover:text-apple-textPrimary dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Platform Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3.5 py-2 rounded-xl text-footnote font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'ai'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-apple-textSecondary dark:text-white/60 hover:text-apple-textPrimary dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>In-Chat @ai Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-2 rounded-xl text-footnote font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'architecture'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'text-apple-textSecondary dark:text-white/60 hover:text-apple-textPrimary dark:hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Architecture & P2P</span>
          </button>

          <button
            onClick={() => setActiveTab('contribute')}
            className={`px-3.5 py-2 rounded-xl text-footnote font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'contribute'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-apple-textSecondary dark:text-white/60 hover:text-apple-textPrimary dark:hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Contribute</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-4 text-footnote">
          {/* TAB 1: Platform Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-apple-secondaryBg dark:bg-white/5 border border-apple-border/50 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-apple-blue font-bold">
                    <Shield className="w-4 h-4" />
                    <span>Zero Login & Ephemeral</span>
                  </div>
                  <p className="text-apple-textSecondary dark:text-white/70 text-caption leading-relaxed">
                    Rooms exist purely in memory and self-destruct after inactivity. No accounts, passwords, or persistent tracking required.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-apple-secondaryBg dark:bg-white/5 border border-apple-border/50 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>In-Room @ai Assistant</span>
                  </div>
                  <p className="text-apple-textSecondary dark:text-white/70 text-caption leading-relaxed">
                    Powered by Nebius DeepSeek-V4. Type <code className="text-xs px-1 py-0.5 bg-black/10 dark:bg-white/10 rounded font-mono">@ai &lt;question&gt;</code> in chat for real-time explanations, quizzes, and code debugging.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-apple-secondaryBg dark:bg-white/5 border border-apple-border/50 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Layers className="w-4 h-4" />
                    <span>Collaborative Whiteboard</span>
                  </div>
                  <p className="text-apple-textSecondary dark:text-white/70 text-caption leading-relaxed">
                    Double-buffered Bézier curve rendering with 0 spikes, Light / Dark Obsidian / Math Grid canvas themes, and 1-tap image broadcast.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-apple-secondaryBg dark:bg-white/5 border border-apple-border/50 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                    <Cpu className="w-4 h-4" />
                    <span>Slide Presenter & Laser</span>
                  </div>
                  <p className="text-apple-textSecondary dark:text-white/70 text-caption leading-relaxed">
                    Multi-peer slide relay synchronization, slide deck management, pen & highlighter markup, and real-time red laser pointer dot tracking.
                  </p>
                </div>
              </div>

              {/* Feature Grid List */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-apple-border/70 dark:border-white/10 space-y-2">
                <h4 className="font-bold text-apple-textPrimary dark:text-white">Included Studio Capabilities:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-caption text-apple-textSecondary dark:text-white/70">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-apple-green shrink-0" /> Echo-Cancelled Voice Messages</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-apple-green shrink-0" /> Synchronized Focus Timer & Presets</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-apple-green shrink-0" /> Live Polls with 1-Tap Deletion</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-apple-green shrink-0" /> Anonymous Upvotable Q&A Queue</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-apple-green shrink-0" /> OTP Verified Notes & Homework Export</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-apple-green shrink-0" /> Draggable Floating Screen Share PiP</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-apple-green shrink-0" /> Direct WebRTC P2P File Transfers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-apple-green shrink-0" /> Faculty Passphrase Moderation</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: In-Chat @ai Guide */}
          {activeTab === 'ai' && (
            <div className="space-y-3.5">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>How to Chat with @ai in Room</span>
                </div>
                <p className="text-apple-textPrimary dark:text-white/90 text-footnote">
                  Any student or instructor can trigger the built-in AI teaching assistant by simply mentioning <code className="px-1.5 py-0.5 bg-purple-200/60 dark:bg-purple-900/60 font-mono rounded font-bold">@ai</code> in their chat message.
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-apple-textPrimary dark:text-white">Example Prompt Templates:</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-apple-secondaryBg dark:bg-white/5 rounded-xl border border-apple-border/40 dark:border-white/10 font-mono text-caption">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">@ai</span> Explain the difference between BFS and DFS with an analogy
                  </div>
                  <div className="p-3 bg-apple-secondaryBg dark:bg-white/5 rounded-xl border border-apple-border/40 dark:border-white/10 font-mono text-caption">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">@ai</span> Quiz me on Big-O complexity of quicksort
                  </div>
                  <div className="p-3 bg-apple-secondaryBg dark:bg-white/5 rounded-xl border border-apple-border/40 dark:border-white/10 font-mono text-caption">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">@ai</span> What features does iChatWorld have for classroom teaching?
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-caption space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Built-in Anti-Abuse Rate Limits:
                </span>
                <p>To ensure fair classroom usage, @ai is rate-limited to 6 queries/min per user and 40 queries/hour per room.</p>
              </div>
            </div>
          )}

          {/* TAB 3: Architecture & Protocols */}
          {activeTab === 'architecture' && (
            <div className="space-y-3.5">
              <div className="p-4 bg-apple-secondaryBg dark:bg-white/5 rounded-xl border border-apple-border/60 dark:border-white/10 space-y-2">
                <h4 className="font-bold text-apple-textPrimary dark:text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-apple-blue" />
                  <span>Mesh Networking & WebRTC DataChannels</span>
                </h4>
                <p className="text-caption text-apple-textSecondary dark:text-white/70 leading-relaxed">
                  iChatWorld establishes direct, end-to-end encrypted WebRTC DataChannels between room participants. Files stream directly over local Wi-Fi / WAN mesh at full gigabit speeds with 0 KB passing through server disks. If peer-to-peer connection is blocked by strict symmetric NATs, an ephemeral 15-minute chunk relay provides seamless fallback.
                </p>
              </div>

              <div className="p-4 bg-apple-secondaryBg dark:bg-white/5 rounded-xl border border-apple-border/60 dark:border-white/10 space-y-2">
                <h4 className="font-bold text-apple-textPrimary dark:text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-apple-green" />
                  <span>Real-Time WebSocket Protocol Events</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-caption text-apple-textSecondary dark:text-white/60">
                  <div><code>room:create / join</code></div>
                  <div><code>chat:send (@ai trigger)</code></div>
                  <div><code>whiteboard:draw / clear</code></div>
                  <div><code>presenter:sync / laser</code></div>
                  <div><code>poll:create / vote / delete</code></div>
                  <div><code>qa:ask / answer / upvote</code></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Contribute to GitHub */}
          {activeTab === 'contribute' && (
            <div className="space-y-3.5">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <Heart className="w-4 h-4 text-emerald-500" />
                  <span>Join the Open-Source Community</span>
                </div>
                <p className="text-apple-textPrimary dark:text-white/90 text-footnote">
                  We welcome contributions from students, educators, and developers worldwide!
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-apple-textPrimary dark:text-white">Quick Setup Instructions:</h4>
                <div className="p-3 bg-black/90 text-white rounded-xl font-mono text-caption space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60"># 1. Clone repository</span>
                    <button
                      onClick={handleCopyClone}
                      className="p-1 hover:bg-white/20 rounded text-caption flex items-center gap-1 text-white/80"
                    >
                      {copiedClone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedClone ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-emerald-400">git clone https://github.com/pwnjoshi/iChatWorld.git</p>
                  <p className="text-white/60"># 2. Install workspace dependencies</p>
                  <p className="text-emerald-400">npm install</p>
                  <p className="text-white/60"># 3. Start local development server</p>
                  <p className="text-emerald-400">npm run dev</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-apple-border/50 dark:border-white/10 text-caption">
                <span className="text-apple-textSecondary dark:text-white/50">Repository: github.com/pwnjoshi/iChatWorld</span>
                <a
                  href="https://github.com/pwnjoshi/iChatWorld"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-apple-blue font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Open GitHub Repo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
