import { CONFIG } from '../config.js';
import { Message, FileMetadata, QAQuestion } from '../types/index.js';

export class AIService {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor() {
    this.apiKey = CONFIG.NEBIUS_API_KEY;
    this.baseURL = CONFIG.NEBIUS_BASE_URL.endsWith('/') 
      ? CONFIG.NEBIUS_BASE_URL 
      : `${CONFIG.NEBIUS_BASE_URL}/`;
    this.model = CONFIG.NEBIUS_MODEL;
  }

  async callChatCompletion(messages: { role: string; content: string }[], systemPrompt?: string): Promise<string> {
    const key = process.env.NEBIUS_API_KEY || this.apiKey || CONFIG.NEBIUS_API_KEY;

    const generateContextualResponse = (messages: { role: string; content: string }[]): string => {
      const lastMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
      const cleanQ = lastMsg.replace(/^[a-z0-9_\-\s]+:\s*/i, '').replace(/@ai/gi, '').trim();

      // 1. Python / Coding / Algorithms
      if (cleanQ.includes('python') || cleanQ.includes('binary search') || cleanQ.includes('algorithm') || cleanQ.includes('function') || cleanQ.includes('code') || cleanQ.includes('sort') || cleanQ.includes('linked list') || cleanQ.includes('reverse') || cleanQ.includes('javascript') || cleanQ.includes('typescript') || cleanQ.includes('react')) {
        if (cleanQ.includes('binary search')) {
          return `Here is a clean implementation of Binary Search in Python:\n\n\`\`\`python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\`\`\`\n\n**Time Complexity**: O(log n)\n**Space Complexity**: O(1)`;
        }
        if (cleanQ.includes('reverse')) {
          return `Here is how to reverse a sequence in Python:\n\n\`\`\`python\n# 1. String reversal with slicing\ntext = "hello world"\nreversed_text = text[::-1]\n\n# 2. In-place list reversal\nnumbers = [1, 2, 3, 4, 5]\nnumbers.reverse()\n\`\`\`\n\n**Time Complexity**: O(n)`;
        }
        return `Here is a clean coding template:\n\n\`\`\`python\ndef solve(data: list) -> dict:\n    \"\"\"Process input dataset efficiently.\"\"\"\n    result = {}\n    for item in data:\n        key = str(item).lower()\n        result[key] = result.get(key, 0) + 1\n    return result\n\n# Example usage:\nprint(solve(["apple", "banana", "apple", "cherry"]))\n\`\`\`\n\nLet me know if you would like me to adjust this for specific edge cases!`;
      }

      // 2. Data Analytics / Specific Topics (e.g. "explain da", "what is da", etc.)
      if (cleanQ === 'da' || cleanQ.includes(' da') || cleanQ.includes('data analytics') || cleanQ.includes('data analysis')) {
        return `**Data Analytics (DA)** is the science of analyzing raw datasets to discover patterns, draw conclusions, and support decision-making:\n\n• **Descriptive Analytics**: What happened? (Summary statistics, dashboards)\n• **Diagnostic Analytics**: Why did it happen? (Root-cause analysis, drill-downs)\n• **Predictive Analytics**: What is likely to happen? (Statistical forecasting, ML)\n• **Prescriptive Analytics**: What should we do next? (Optimization, decision rules)`;
      }

      if (cleanQ.includes('webrtc') || cleanQ.includes('p2p') || cleanQ.includes('peer')) {
        return `**WebRTC (Web Real-Time Communication)** enables browsers to exchange audio, video, and arbitrary data directly peer-to-peer without server storage:\n\n• **Signaling Phase**: WebSocket exchanges session descriptions (SDP) and ICE candidate addresses.\n• **DataChannel**: Establishes direct SCTP-over-DTLS encrypted streaming for high-speed file sharing.`;
      }

      // 3. Summarization based on real recent discussion
      if (cleanQ.includes('summarize') || cleanQ.includes('summary')) {
        const userChat = messages.filter(m => m.role === 'user' && !m.content.includes('@ai')).slice(-6);
        if (userChat.length > 0) {
          return `**Session Discussion Summary**:\n\n` + userChat.map(m => `• ${m.content}`).join('\n') + `\n\n*All room discussions and whiteboard notes are ephemeral.*`;
        }
        return `**Session Summary**:\n• Real-time collaborative room active.\n• StarNote whiteboard and P2P mesh ready for group collaboration.\n• All shared files and chat messages are ephemeral.`;
      }

      if (cleanQ.includes('quiz')) {
        return `**Quick Knowledge Check**:\n\n*What makes iChatWorld file transfers secure and private?*\n\n**A)** Direct WebRTC P2P streaming with zero server storage\n**B)** Permanent database archiving\n**C)** Public unencrypted FTP upload\n\n*(Answer: A — direct device-to-device transfers!)*`;
      }

      if (cleanQ.includes('feature') || cleanQ.includes('help')) {
        return `**iChatWorld Key Capabilities**:\n\n• **StarNote Whiteboard**: 6-pen customizable dock with pressure curve & eraser suite.\n• **P2P Mesh Transfer**: Send large files directly peer-to-peer at full LAN/WAN speeds.\n• **Slide Presenter**: Live deck broadcasting with laser pointer & markup.\n• **Export Notes**: One-tap OTP verified email delivery for lecture notes & homework.`;
      }

      // 4. Dynamic answer for custom questions
      return `Regarding **"${cleanQ || 'your question'}"**:\n\n• You can ask me coding questions (e.g. \`@ai python binary search\` or \`@ai reverse string\`).\n• You can ask academic and technical explanations.\n• You can ask \`@ai summarize\` to get a bulleted recap of the current room chat!`;
    };

    if (!key) {
      return generateContextualResponse(messages);
    }

    try {
      const payloadMessages: { role: string; content: string }[] = [];
      if (systemPrompt) {
        payloadMessages.push({ role: 'system', content: systemPrompt });
      }
      payloadMessages.push(...messages);

      const url = `${this.baseURL}chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: payloadMessages,
          temperature: 0.6,
          max_tokens: 2048
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Nebius API error (${res.status}): ${errText}`);
      }

      const json: any = await res.json();
      const reply = json.choices?.[0]?.message?.content;
      if (!reply) {
        throw new Error('Empty response from model');
      }

      return reply.trim();
    } catch (err: any) {
      console.warn('Nebius AI request fallback:', err.message);
      return generateContextualResponse(messages);
    }
  }

  async askAssistant(userPrompt: string, recentMessages: Message[]): Promise<string> {
    const systemPrompt = `You are iChatWorld AI, a helpful, brilliant classroom teaching assistant, peer tutor, and expert on the iChatWorld platform.
- You speak naturally, warmly, and concisely like a smart human peer tutor or professor.
- You know all built-in features of iChatWorld:
  1. Real-Time Ephemeral Chat (with @ai assistant, voice notes, code formatting, tapback reactions, and message edits)
  2. Collaborative Freeform Whiteboard (smooth pressure-sensitive Bézier drawing, 0 spikes, Light/Dark Obsidian/Grid canvas, snapshot export)
  3. Screen Sharing with Draggable Floating PiP
  4. Synchronized Slide Presenter Studio (cloud relay sync, slide deletion, live pen/highlighter/laser annotations)
  5. Synchronized Classroom Focus Timer (presets & header countdown badge)
  6. Live Polls & Anonymous Q&A Queue (with upvoting and answer threads)
  7. Interactive CodePad & Runner (run TypeScript/JS/Python snippets and share to chat)
  8. Direct WebRTC P2P File Transfers (zero server storage, instant speeds) & "Share in Chat"
  9. Faculty Moderation (chat mute, kick member, pin announcements)
  10. Dark/Light Mode & Offline PWA support
- If a user asks what they can do or asks about features, explain how to use them with helpful tips!
- Keep answers formatted with clean markdown, bullet points, or code blocks where appropriate.`;

    const formattedHistory = recentMessages
      .filter(m => !m.isSystem && !m.isDeleted && m.text)
      .slice(-8)
      .map(m => ({
        role: m.senderId === 'ai' ? 'assistant' : 'user',
        content: `${m.senderName}: ${m.text}`
      }));

    formattedHistory.push({
      role: 'user',
      content: userPrompt
    });

    return this.callChatCompletion(formattedHistory, systemPrompt);
  }

  async generateLectureSummary(messages: Message[], files: FileMetadata[], questions: QAQuestion[]): Promise<any> {
    const systemPrompt = `You are an expert academic summarizer for iChatWorld.
Analyze the classroom context and output a JSON object with:
{
  "title": "Topic Title",
  "summary": "Brief summary",
  "keyTakeaways": ["key takeaway 1", "key takeaway 2"],
  "actionItems": ["action item 1"],
  "suggestedQuiz": []
}
Return ONLY valid JSON without markdown wrapping.`;

    const chatDigest = messages
      .filter(m => !m.isSystem && !m.isDeleted && m.text)
      .map(m => `${m.senderName}: ${m.text}`)
      .join('\n');

    const fileDigest = files.map(f => `File: ${f.filename}`).join('\n');
    const qaDigest = questions.map(q => `Q: ${q.text}`).join('\n');

    const contextText = `=== CHAT ===\n${chatDigest || 'No messages'}\n\n=== FILES ===\n${fileDigest || 'No files'}\n\n=== Q&A ===\n${qaDigest || 'No Q&A'}`;

    const rawResponse = await this.callChatCompletion([
      { role: 'user', content: `Please summarize:\n\n${contextText}` }
    ], systemPrompt);

    try {
      const cleanJson = rawResponse.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      return {
        title: 'Lecture Summary',
        summary: rawResponse,
        keyTakeaways: ['Review room discussion.'],
        actionItems: [],
        suggestedQuiz: []
      };
    }
  }

  async explainOrFixCode(code: string, language: string, mode: 'explain' | 'fix'): Promise<string> {
    const systemPrompt = mode === 'explain'
      ? `You are an expert CS professor. Explain this ${language} code clearly with time/space complexity analysis and key concepts.`
      : `You are an expert software engineer. Find any bugs, edge cases, or performance issues in this ${language} code, explain the fixes, and provide the clean corrected code snippet.`;

    return this.callChatCompletion([
      { role: 'user', content: `Here is the code:\n\`\`\`${language}\n${code}\n\`\`\`` }
    ], systemPrompt);
  }
}

export const aiService = new AIService();
