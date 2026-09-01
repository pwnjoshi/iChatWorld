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

    if (!key) {
      const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || '';
      if (lastMsg.includes('python') || lastMsg.includes('code') || lastMsg.includes('binary') || lastMsg.includes('function')) {
        return `Here is a clean implementation:\n\n\`\`\`python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\`\`\`\n\n**Time Complexity**: O(log n)\n**Space Complexity**: O(1)`;
      }
      if (lastMsg.includes('summarize')) {
        return `Here is a summary of the current session:\n\n• Real-time collaborative workspace active.\n• StarNote whiteboard & WebRTC mesh ready for group work.\n• All room data is ephemeral and self-destructs when everyone leaves.`;
      }
      if (lastMsg.includes('quiz')) {
        return `Quick Knowledge Check:\n\n*What makes iChatWorld file transfers secure and private?*\n\n**A)** Direct WebRTC P2P streaming with zero server storage\n**B)** Permanent database archiving\n**C)** Public unencrypted FTP upload\n\n*(Answer: A — direct device-to-device transfers!)*`;
      }
      if (lastMsg.includes('explain') || lastMsg.includes('feature') || lastMsg.includes('ho')) {
        return `iChatWorld is an ephemeral collaboration workspace designed for real-time classroom and group teamwork:\n\n• **StarNote Whiteboard**: 6-pen customizable dock with pressure curve & eraser suite.\n• **P2P Mesh Transfer**: Send large files directly peer-to-peer at full LAN/WAN speeds.\n• **Slide Presenter**: Live deck broadcasting with laser pointer & markup.\n• **Export Notes**: One-tap OTP verified email delivery for lecture notes & homework.`;
      }
      return `Hello! I am your iChatWorld AI assistant. You can ask me to explain coding concepts, write functions, quiz the room, or summarize lecture discussions!`;
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
      const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || '';
      if (lastMsg.includes('python') || lastMsg.includes('code') || lastMsg.includes('binary') || lastMsg.includes('function')) {
        return `Here is a clean implementation:\n\n\`\`\`python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n\`\`\`\n\n**Time Complexity**: O(log n)\n**Space Complexity**: O(1)`;
      }
      return `iChatWorld is an ephemeral collaboration workspace designed for real-time group teamwork:\n\n• **StarNote Whiteboard**: 6-pen customizable dock with pressure curve & eraser suite.\n• **P2P Mesh Transfer**: Send large files directly peer-to-peer at full LAN/WAN speeds.\n• **Slide Presenter**: Live deck broadcasting with laser pointer & markup.\n• **Export Notes**: One-tap OTP verified email delivery for lecture notes & homework.`;
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
