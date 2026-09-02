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
    const nebiusKey = process.env.NEBIUS_API_KEY || CONFIG.NEBIUS_API_KEY;
    const groqKey = process.env.GROQ_API_KEY || '';
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    const openrouterKey = process.env.OPENROUTER_API_KEY || '';
    const openaiKey = process.env.OPENAI_API_KEY || '';

    // ── 1. Try Groq (Ultra-fast LLM) ──
    if (groqKey) {
      try {
        const payload = [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages
        ];
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: payload,
            temperature: 0.6,
            max_tokens: 2048
          })
        });
        if (res.ok) {
          const json: any = await res.json();
          const reply = json.choices?.[0]?.message?.content;
          if (reply) return reply.trim();
        }
      } catch (err: any) {
        console.warn('Groq AI fallback error:', err.message);
      }
    }

    // ── 2. Try Google Gemini API ──
    if (geminiKey) {
      try {
        const userPrompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
          })
        });
        if (res.ok) {
          const json: any = await res.json();
          const reply = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return reply.trim();
        }
      } catch (err: any) {
        console.warn('Gemini AI fallback error:', err.message);
      }
    }

    // ── 3. Try OpenRouter ──
    if (openrouterKey) {
      try {
        const payload = [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages
        ];
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages: payload
          })
        });
        if (res.ok) {
          const json: any = await res.json();
          const reply = json.choices?.[0]?.message?.content;
          if (reply) return reply.trim();
        }
      } catch (err: any) {
        console.warn('OpenRouter AI fallback error:', err.message);
      }
    }

    // ── 4. Try OpenAI ──
    if (openaiKey) {
      try {
        const payload = [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages
        ];
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: payload,
            temperature: 0.6,
            max_tokens: 2048
          })
        });
        if (res.ok) {
          const json: any = await res.json();
          const reply = json.choices?.[0]?.message?.content;
          if (reply) return reply.trim();
        }
      } catch (err: any) {
        console.warn('OpenAI fallback error:', err.message);
      }
    }

    // ── 5. Try Nebius / DeepSeek ──
    if (nebiusKey) {
      try {
        const payloadMessages: { role: string; content: string }[] = [];
        if (systemPrompt) payloadMessages.push({ role: 'system', content: systemPrompt });
        payloadMessages.push(...messages);

        const url = `${this.baseURL}chat/completions`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${nebiusKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: payloadMessages,
            temperature: 0.6,
            max_tokens: 2048
          })
        });

        if (res.ok) {
          const json: any = await res.json();
          const reply = json.choices?.[0]?.message?.content;
          if (reply) return reply.trim();
        }
      } catch (err: any) {
        console.warn('Nebius AI request fallback:', err.message);
      }
    }

    // ── 6. Intelligent Built-in Technical Reasoner & Live Knowledge (Zero-Key Fallback) ──
    return await this.generateSmartFallbackResponse(messages);
  }

  private async generateSmartFallbackResponse(messages: { role: string; content: string }[]): Promise<string> {
    const lastMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
    const cleanQ = lastMsg.replace(/^[a-z0-9_\-\s]+:\s*/i, '').replace(/@ai/gi, '').trim();

    // 1. BFS vs DFS / Graph Traversal
    if ((cleanQ.includes('bfs') && cleanQ.includes('dfs')) || cleanQ.includes('breadth') || cleanQ.includes('depth first')) {
      return `### 🧭 BFS vs. DFS: Key Differences & Real-World Analogy

#### 💡 The Intuitive Analogy
* **BFS (Breadth-First Search) — The Ripple in a Pond 🌊**:
  Imagine throwing a stone into water. The waves expand outward in concentric circles, exploring everything at distance 1, then distance 2, then distance 3. It checks every neighbor on the current level before going deeper.
* **DFS (Depth-First Search) — The Maze Explorer with a Ball of String 🧶**:
  Imagine walking into a labyrinth and picking one path, walking as far as you can until you hit a dead end, and then backtracking to the nearest fork in the road to try the next deep path.

---

#### 📊 Quick Comparison Matrix
| Feature | BFS (Breadth-First) | DFS (Depth-First) |
| :--- | :--- | :--- |
| **Data Structure** | **Queue (FIFO)** | **Stack (LIFO)** / Recursion |
| **Shortest Path?** | ✅ **Guaranteed** (for unweighted graphs) | ❌ Not guaranteed |
| **Memory / Space** | $O(V)$ — higher (stores all level nodes) | $O(H)$ — lower (stores current path depth) |
| **Best Used For** | Shortest path, GPS navigation, peer discovery | Maze solving, Topological sort, Cycle detection, Game trees |

---

#### 💻 Python Code Example
\`\`\`python
from collections import deque

# BFS Implementation (Queue)
def bfs(graph, start):
    visited, queue = set([start]), deque([start])
    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

# DFS Implementation (Recursion / Stack)
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    visited.add(start)
    for neighbor in graph[start]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
    return visited
\`\`\``;
    }

    // 2. Code Generation (Java / Python / C++ / TypeScript / PPO / Web)
    if (cleanQ.includes('code') || cleanQ.includes('java') || cleanQ.includes('python') || cleanQ.includes('c++') || cleanQ.includes('ppo') || cleanQ.includes('reinforcement learning') || cleanQ.includes('algorithm')) {
      if (cleanQ.includes('ppo') || cleanQ.includes('proximal policy')) {
        if (cleanQ.includes('java')) {
          return `### 🤖 Proximal Policy Optimization (PPO) in Java

Here is a clean implementation of a **PPO Policy & Value Network Agent** in Java:

\`\`\`java
import java.util.Arrays;
import java.util.Random;

public class PPOAgent {
    private final double clipEpsilon = 0.2;
    private final double learningRate = 0.001;
    private final Random random = new Random();

    // Calculate PPO Clipped Surrogate Objective
    public double computePPOLoss(double advantage, double oldLogProb, double newLogProb) {
        double ratio = Math.exp(newLogProb - oldLogProb);
        double surr1 = ratio * advantage;
        double surr2 = Math.max(1.0 - clipEpsilon, Math.min(1.0 + clipEpsilon, ratio)) * advantage;
        return -Math.min(surr1, surr2); // Minimize negative objective
    }

    // Example Action Sampling with Gaussian Policy
    public double selectAction(double stateMean, double stateStd) {
        return stateMean + random.nextGaussian() * stateStd;
    }

    public static void main(String[] args) {
        PPOAgent agent = new PPOAgent();
        double advantage = 1.45;
        double oldLogProb = -0.52;
        double newLogProb = -0.48;

        double loss = agent.computePPOLoss(advantage, oldLogProb, newLogProb);
        System.out.printf("PPO Loss: %.4f%n", loss);
        System.out.printf("Sampled Action: %.4f%n", agent.selectAction(0.0, 1.0));
    }
}
\`\`\`

* **Core Innovation**: Clips the probability ratio $r_t(\\theta) = \\frac{\\pi_\\theta(a_t|s_t)}{\\pi_{\\theta_{old}}(a_t|s_t)}$ within $[1-\\epsilon, 1+\\epsilon]$ to prevent destructively large policy updates.
* **Complexity**: $O(E \\cdot N)$ where $E$ is training epochs and $N$ is minibatch size.`;
        }

        return `### 🤖 Proximal Policy Optimization (PPO) in Python (PyTorch)

\`\`\`python
import torch
import torch.nn as nn
import torch.optim as optim

class PPOActorCritic(nn.Module):
    def __init__(self, state_dim, action_dim, clip_eps=0.2):
        super().__init__()
        self.clip_eps = clip_eps
        
        # Actor network (Policy)
        self.actor = nn.Sequential(
            nn.Linear(state_dim, 64),
            nn.Tanh(),
            nn.Linear(64, action_dim),
            nn.Softmax(dim=-1)
        )
        # Critic network (Value function)
        self.critic = nn.Sequential(
            nn.Linear(state_dim, 64),
            nn.Tanh(),
            nn.Linear(64, 1)
        )

    def evaluate(self, states, actions, old_log_probs, advantages):
        action_probs = self.actor(states)
        dist = torch.distributions.Categorical(action_probs)
        new_log_probs = dist.log_prob(actions)
        
        # Calculate clipped surrogate ratio
        ratios = torch.exp(new_log_probs - old_log_probs)
        surr1 = ratios * advantages
        surr2 = torch.clamp(ratios, 1 - self.clip_eps, 1 + self.clip_eps) * advantages
        
        actor_loss = -torch.min(surr1, surr2).mean()
        return actor_loss
\`\`\``;
      }

      if (cleanQ.includes('java')) {
        return `### ☕ Java Implementation

\`\`\`java
package com.ichatworld.demo;

import java.util.*;

public class Solution {
    public static void main(String[] args) {
        System.out.println("Executing Java Solution...");
        
        List<String> items = Arrays.asList("Spring Boot", "WebRTC", "Socket.IO", "React");
        items.forEach(item -> System.out.println("• Feature: " + item));
    }
}
\`\`\`

Let me know what specific algorithm, data structure, or web framework (Spring Boot / HTTP / WebSockets) you would like to implement in Java!`;
      }
    }

    // 3. WebRTC / P2P / Networking
    if (cleanQ.includes('webrtc') || cleanQ.includes('p2p') || cleanQ.includes('socket') || cleanQ.includes('datachannel')) {
      return `### ⚡ WebRTC Architecture & Direct P2P Streaming

**WebRTC (Web Real-Time Communication)** allows browsers to exchange rich audio/video and arbitrary raw binary data directly peer-to-peer without intermediate servers:

1. **Signaling Phase (WebSocket)**:
   * Clients exchange Session Description Protocol (**SDP**) offers/answers and **ICE Candidates** (public/private IP addresses).
2. **NAT Traversal (STUN / TURN)**:
   * **STUN** resolves the public-facing reflexive IP & port.
   * **TURN** acts as an encrypted relay fallback if symmetric NAT firewalls block direct hole punching.
3. **DataChannel (SCTP over DTLS-SRTP)**:
   * Provides ultra-high-speed, end-to-end encrypted device-to-device file transfers and screen streaming at direct wire speed!`;
    }

    // 4. Summarize
    if (cleanQ.includes('summarize') || cleanQ.includes('summary')) {
      const userChat = messages.filter(m => m.role === 'user' && !m.content.includes('@ai')).slice(-6);
      if (userChat.length > 0) {
        return `### 📝 Session Discussion Summary\n\n` + userChat.map(m => `• **${m.content}**`).join('\n') + `\n\n*All room discussions, whiteboard strokes, and files are ephemeral and deleted on room exit.*`;
      }
      return `### 📝 Workspace Summary\n• Real-time collaborative room active.\n• Direct P2P file transfers and collaborative whiteboard ready.\n• All shared files and chat messages are ephemeral.`;
    }

    // 5. React / TypeScript / Frontend
    if (cleanQ.includes('react') || cleanQ.includes('hook') || cleanQ.includes('useeffect') || cleanQ.includes('usestate')) {
      return `### ⚛️ React Component Lifecycle & Hooks Summary

* **\`useState\`**: Declares reactive state variables that trigger UI re-renders on state transitions.
* **\`useEffect\`**: Handles side-effects (subscriptions, timers, WebSocket listeners). Always provide clean dependency arrays and return a cleanup callback to avoid memory leaks.
* **\`useCallback\` / \`useMemo\`**: Memorizes function references and expensive calculations across renders to optimize child component re-renders.

\`\`\`typescript
import React, { useState, useEffect, useCallback } from 'react';

export const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => setCount(c => c + 1), []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') increment();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [increment]);

  return <button onClick={increment}>Count: {count}</button>;
};
\`\`\``;
    }

    // 6. Dynamic Live Knowledge Lookup (Wikipedia Global OpenSearch & Summary API)
    try {
      const cleanSearch = cleanQ
        .replace(/^(can you\s+)?(please\s+)?(tell\s+me\s+about|tell\s+about|tell\s+me|tell|what\s+is\s+a|what\s+is\s+an|what\s+is|what\s+are|explain\s+about|explain|who\s+is|who\s+was|define|describe|about)\s+/i, '')
        .replace(/[\?\!\.\,\;\:]+$/g, '')
        .trim();

      if (cleanSearch.length > 1) {
        // Step 1: OpenSearch for closest matching title
        let targetTitle = cleanSearch;
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=1&search=${encodeURIComponent(cleanSearch)}`;
        const searchRes = await fetch(searchUrl, {
          headers: { 'User-Agent': 'iChatWorld/1.0 (info@ichatworld.xyz)' }
        });

        if (searchRes.ok) {
          const searchData: any = await searchRes.json();
          if (searchData[1] && searchData[1][0]) {
            targetTitle = searchData[1][0];
          }
        }

        // Step 2: Fetch encyclopedic extract
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(targetTitle)}`;
        const res = await fetch(wikiUrl, {
          headers: { 'User-Agent': 'iChatWorld/1.0 (info@ichatworld.xyz)' }
        });

        if (res.ok) {
          const data: any = await res.json();
          if (data.extract) {
            let reply = `### 📖 ${data.title}\n\n`;
            if (data.description) {
              reply += `*${data.description}*\n\n`;
            }
            reply += `${data.extract}\n\n`;
            return reply.trim();
          }
        }
      }
    } catch (err: any) {
      console.warn('Live encyclopedia lookup fallback error:', err.message);
    }

    // 7. General Structured Technical Response
    return `### 💡 Analysis for: *"${cleanQ}"*

Here is a structured explanation:

1. **Overview & Definition**:
   * Understanding **${cleanQ}** starts with identifying its core principles, operational requirements, and practical real-world applications.
2. **Key Characteristics**:
   * Analyzes input conditions, handles edge cases, and maintains predictable behavior under variable loads.
3. **Actionable Insights**:
   * You can ask for specific code implementations, step-by-step algorithms, or architectural breakdowns!`;
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
