import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Play, Copy, Check, Share2, Terminal, Code } from 'lucide-react';

interface CodePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareToChat: (code: string, language: string) => Promise<boolean>;
}

const DEFAULT_SNIPPETS: Record<string, string> = {
  javascript: `// Interactive JavaScript Runner
function fibonacci(n) {
  const seq = [0, 1];
  for (let i = 2; i < n; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq;
}

console.log("Fibonacci(10):", fibonacci(10));
console.log("Classroom code runner ready!");`,
  python: `# Python Example Snippet
def calculate_grades(scores):
    average = sum(scores) / len(scores)
    return f"Average Score: {average:.2f}"

exam_scores = [92, 85, 99, 78, 94]
print(calculate_grades(exam_scores))`,
  typescript: `interface Student {
  id: number;
  name: string;
  enrolled: boolean;
}

const student: Student = { id: 101, name: "Alex", enrolled: true };
console.log("Enrolled Student:", student);`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello iChatWorld Classroom!" << endl;
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Java Classroom Snippet");
    }
}`
};

export const CodePadModal: React.FC<CodePadModalProps> = ({ isOpen, onClose, onShareToChat }) => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_SNIPPETS['javascript']);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (DEFAULT_SNIPPETS[lang]) {
      setCode(DEFAULT_SNIPPETS[lang]);
    }
    setOutput([]);
  };

  const runCode = () => {
    setIsRunning(true);
    const logs: string[] = [];

    if (language === 'javascript' || language === 'typescript') {
      try {
        const customConsole = {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args: any[]) => logs.push('❌ ' + args.join(' ')),
          warn: (...args: any[]) => logs.push('⚠️ ' + args.join(' '))
        };

        const runner = new Function('console', code);
        runner(customConsole);
        setOutput(logs.length > 0 ? logs : ['Execution finished with no output.']);
      } catch (err: any) {
        setOutput([`Error: ${err.message}`]);
      }
    } else {
      setOutput([`[${language.toUpperCase()} Sandbox Ready] Output simulated for classroom demo.`]);
    }

    setIsRunning(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    const formatted = `\`\`\`${language}\n${code}\n\`\`\``;
    await onShareToChat(formatted, language);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Classroom Code Pad & Runner" maxWidth="max-w-3xl">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-apple-border/50">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-apple-blue" />
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1.5 bg-apple-secondaryBg rounded-lg text-footnote font-semibold text-apple-textPrimary border border-apple-border/60 outline-none focus:ring-1 focus:ring-apple-blue"
            >
              <option value="javascript">JavaScript (ES2024)</option>
              <option value="python">Python 3</option>
              <option value="typescript">TypeScript</option>
              <option value="cpp">C++ (C++20)</option>
              <option value="java">Java 21</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-apple-secondaryBg hover:bg-apple-tertiaryBg text-apple-textPrimary font-medium text-caption transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-apple-green" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-apple-secondaryBg hover:bg-apple-tertiaryBg text-apple-blue font-semibold text-caption transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share to Chat</span>
            </button>

            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-apple-green hover:bg-emerald-600 text-white font-semibold text-caption transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Code</span>
            </button>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="relative rounded-ios-card overflow-hidden border border-apple-border/70 bg-[#1E1E1E] text-white">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={12}
            className="w-full p-4 font-mono text-xs md:text-sm bg-transparent text-emerald-400 outline-none resize-none leading-relaxed selection:bg-apple-blue"
          />
        </div>

        {/* Output Console */}
        {output.length > 0 && (
          <div className="rounded-ios-card bg-black border border-white/10 p-3 space-y-1.5 font-mono text-xs text-white">
            <div className="flex items-center gap-2 text-apple-textSecondary text-[11px] pb-1 border-b border-white/10">
              <Terminal className="w-3.5 h-3.5" />
              <span>Console Output</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pt-1">
              {output.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
