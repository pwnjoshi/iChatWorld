# iChatWorld — Disposable Workspaces for Real-Time Collaboration

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P%20Streaming-FF6B6B?logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![DeepSeek-V4](https://img.shields.io/badge/AI-DeepSeek--V4--Flash-007AFF)](https://tokenfactory.nebius.com/)
[![Netlify Deploy](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com/)

> **Zero accounts. No tracking. Ephemeral self-destructing rooms.**  
> A fast, disposable room platform for live chat, direct WebRTC gigabit file drops, synchronized whiteboard, and presentation tools for teams, labs, study groups, hackathons, and workshops.

---

## 🌟 Core Capabilities

### 💬 1. Live Ephemeral Chat & In-Room @ai Assistant
- **In-Room `@ai` Assistant**: Type `@ai <prompt>` in chat for instant peer tutoring, code analysis, and conceptual explanations powered by Nebius DeepSeek-V4-Flash.
- **Voice Notes & Code Blocks**: Clean voice recording with hardware-grade acoustic echo cancellation and syntax-highlighted code blocks with tapback reactions.

### 🎨 2. Collaborative Whiteboard Studio
- **Bézier Pressure Strokes**: Double-buffered active stroke rendering with 0 spikes, 60–120fps smooth drawing.
- **Paper Themes**: Pure White, Dark Obsidian (`#121212`), and Math Grid paper modes with 1-tap snapshot exports.

### 📁 3. Direct WebRTC P2P File Transfers
- **Direct Mesh Streaming**: Multi-megabyte files stream directly peer-to-peer over local Wi-Fi / gigabit network without passing through or persisting on server disks.
- **Share in Chat**: 1-tap button to post instant download references into the active chat stream.

### 📑 4. Synchronized Slide Presenter & Laser
- **Cloud Relay Sync**: Upload presentation slide decks with real-time synchronized slide transitions across all participants.
- **Live Annotations**: Draw on slides with pen, highlighter, eraser, and glowing red laser pointer dot tracking.

### ⏱️ 5. Focus Timer, Live Polls & Q&A Queue
- **Synchronized Focus Timer**: Presets (2m, 5m, 10m, 15m) with auto-closing modal and header countdown badge.
- **Live Polls**: Real-time aggregated voting with 1-tap creator/host deletion.
- **Anonymous Q&A**: Question queue with upvoting and threaded answers.

### 🖥️ 6. Draggable Floating Screen Share PiP & CodePad
- **Draggable PiP**: Position your floating screen share anywhere on the screen without obscuring your workspace.
- **Interactive CodePad**: In-browser multi-language runner with broadcast to chat.

### 🛡️ 7. Host Moderation Controls
- Unlock moderation tools with a room passphrase: whole-room chat mute, pinned announcements, and member removal.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   iChatWorld Client                    │
│     (React 18 + Vite + Tailwind CSS + Lucide Icons)    │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
   [WebRTC P2P DataChannels]      [Socket.io WebSocket]
   • Direct File Streaming        • Room Lifecycle & State
   • Zero-Storage P2P Transfer    • Whiteboard & Slide Sync
               │                  • Timer & Poll Sync
               ▼                  • Chat & Typing Events
┌────────────────────────┐                │
│    Peer Browsers       │                ▼
│ (Teams, Labs, Peers)   │    ┌──────────────────────────┐
└────────────────────────┘    │   Node.js Express Server │
                              │   (WebSocket Signaling)  │
                              └───────────┬──────────────┘
                                          │
                  ┌───────────────────────┴──────────────────────┐
                  ▼                                              ▼
    ┌───────────────────────────┐                  ┌───────────────────────────┐
    │  Ephemeral Store Engine   │                  │  Nebius AI TokenFactory   │
    │  • In-Memory Map (Default)│                  │  (DeepSeek-V4-Flash)      │
    │  • Redis Cloud (Optional) │                  │  • In-Room @ai Assistant  │
    │  • Auto-TTL Self-Destruct │                  │  • Code & Question Helper │
    └───────────────────────────┘                  └───────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **pnpm** or **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/pwnjoshi/iChatWorld.git
cd iChatWorld
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=3001
CORS_ORIGIN=*
FACULTY_PASSPHRASE=faculty123

# Optional: Nebius DeepSeek-V4 AI Integration
NEBIUS_API_KEY=your_nebius_api_key_here
NEBIUS_BASE_URL=https://api.tokenfactory.us-central1.nebius.com/v1/
NEBIUS_MODEL=deepseek-ai/DeepSeek-V4-Flash
```

### 4. Run Locally
```bash
npm run dev
```
- **Frontend App**: http://localhost:5173
- **Backend API & WebSocket**: http://localhost:3001

---

## 📦 Deployment Guide

### Option A: Deploy Frontend on Netlify + Backend on Render/Railway/Fly.io (Recommended)

#### Step 1: Deploy Backend (Render / Railway / Fly.io / VPS)
1. Push your repository to GitHub: `https://github.com/pwnjoshi/iChatWorld`
2. Create a new **Web Service** on [Render](https://render.com/) or [Railway](https://railway.app/).
3. Set build settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: `3001` (or provided by host)
     - `FACULTY_PASSPHRASE`: `your_secure_passphrase`
     - `NEBIUS_API_KEY`: `your_nebius_api_key`
     - `CORS_ORIGIN`: `*`
4. Copy your backend service URL (e.g. `https://ichatworld-server.onrender.com`).

#### Step 2: Deploy Frontend to Netlify
1. Go to [Netlify](https://app.netlify.com/) and click **"Add new site" -> "Import an existing project"**.
2. Select your repository `pwnjoshi/iChatWorld`.
3. Set build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. In **Site configuration > Environment variables**, add:
   - `VITE_BACKEND_URL`: `https://ichatworld-server.onrender.com` (your backend URL from Step 1)
5. Click **Deploy Site**!

---

### Option B: Monolithic Full-Stack Deployment (Docker / VPS)

```bash
# Build both frontend and backend
npm run build

# Start the full-stack server (serves client/dist statically)
npm start
```

---

## 🔒 Security & Privacy Architecture

- **No Persisted Logs or Accounts**: Users join with a temporary display name. No emails, phone numbers, or passwords stored.
- **Ephemeral Storage**: All messages, whiteboard strokes, polls, and questions reside in memory with automatic time-to-live (TTL) expiration.
- **Security Headers**: Built-in HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`).
- **Encrypted P2P Channels**: WebRTC DataChannels are end-to-end encrypted via DTLS/SCTP.
- **No Secret Leaks**: `.env` and sensitive API keys are strictly excluded from git tracking.

---

## 🧪 Testing

Run test suites:

```bash
# Test all tools (Whiteboard, Screen Share, Code Pad, Timer, Q&A, Slides)
npx tsx server/scripts/test-all-tools.ts

# Test AI Assistant, Poll Deletion & Slide Annotations
npx tsx server/scripts/test-new-features.ts

# Test full end-to-end room message & file management
npx tsx server/scripts/test-message-file-management.ts
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

Developed by **[Pawan Joshi](https://github.com/pwnjoshi)**  
GitHub: [@pwnjoshi](https://github.com/pwnjoshi)
