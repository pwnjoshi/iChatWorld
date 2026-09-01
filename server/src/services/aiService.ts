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
    if (!this.apiKey) {
      throw new Error('NEBIUS_API_KEY is not configured');
    }

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
        'Authorization': `Bearer ${this.apiKey}`
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
      throw new Error(`Nebius DeepSeek API error (${res.status}): ${errText}`);
    }

    const json: any = await res.json();
    const reply = json.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error('Empty response received from AI model');
    }

    return reply.trim();
  }

  async askAssistant(userPrompt: string, recentMessages: Message[]): Promise<string> {
    const systemPrompt = `You are iChatWorld AI, a helpful, brilliant classroom teaching assistant and peer tutor.
- Respond concisely with high clarity, clean formatting, bullet points, or code snippets where appropriate.
- If asked a conceptual or math question, provide an intuitive explanation followed by step-by-step reasoning.
- Keep the tone encouraging, academic, and calm (Apple-style simplicity).`;

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
Analyze the classroom lecture session context (messages, shared files, student questions) and output a JSON object with:
{
  "title": "Lecture / Session Topic Title",
  "summary": "2-3 paragraph concise overview of everything discussed",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4"],
  "actionItems": ["assignment/task 1", "reading or deadline 2"],
  "suggestedQuiz": [
    {
      "question": "Quiz question based on lecture?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this option is correct"
    }
  ]
}
Return ONLY valid JSON without markdown wrapping or code blocks.`;

    const chatDigest = messages
      .filter(m => !m.isSystem && !m.isDeleted && m.text)
      .map(m => `${m.senderName}: ${m.text}`)
      .join('\n');

    const fileDigest = files.map(f => `File: ${f.filename} (${(f.size / 1024).toFixed(1)} KB)`).join('\n');
    const qaDigest = questions.map(q => `Q: ${q.text} (Answered: ${q.isAnswered})`).join('\n');

    const contextText = `=== CHAT TRANSCRIPT ===\n${chatDigest || 'No chat messages'}\n\n=== SHARED FILES ===\n${fileDigest || 'No files'}\n\n=== Q&A QUEUE ===\n${qaDigest || 'No Q&A'}`;

    const rawResponse = await this.callChatCompletion([
      { role: 'user', content: `Please summarize this lecture session:\n\n${contextText}` }
    ], systemPrompt);

    try {
      const cleanJson = rawResponse.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      return {
        title: 'Lecture Summary',
        summary: rawResponse,
        keyTakeaways: ['Review the discussion in the room.'],
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
