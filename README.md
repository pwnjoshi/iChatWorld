# 💬 iChatWorld — Ephemeral Collaborative Classroom & Real-Time Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P%20Streaming-FF6B6B?logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![DeepSeek-V4](https://img.shields.io/badge/AI-DeepSeek--V4--Flash-8A2BE2)](https://tokenfactory.nebius.com/)
[![Netlify Deploy](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify&logoColor=white)](https://www.netlify.com/)

> **Zero logins. Zero trackers. Ephemeral self-destructing rooms.**  
> A high-performance real-time virtual classroom, presentation studio, and peer-to-peer file sharing platform built with an Apple-grade minimalist aesthetic.

---

## 🌟 Highlights & Key Features

### 🤖 1. DeepSeek-V4-Flash AI Integration (Nebius TokenFactory)
- **In-Room `@ai` Teaching Assistant**: Type `@ai <question>` directly in chat for instant, context-aware answers broadcast to the room.
- **✨ AI Lecture Digest & Summary**: 1-tap header button synthesizes messages, uploaded files, and student Q&A into structured summaries, key takeaways, action items, and concept quizzes with markdown export.

### 🎨 2. Collaborative Whiteboard Studio
- **Buttery-Smooth Bézier Splines**: Double-buffered active stroke rendering eliminates jitter and jagged spikes at 60–120fps.
- **Canvas Paper Themes**: Toggle between Pure White, Dark Obsidian (`#121212`), and Math Grid paper modes.
- **Tools**: Pressure-sensitive Pen, Highlighter, Eraser, Geometric Shapes, Pan/Zoom Navigation, and Snapshot Broadcast to room files.

### 🖥️ 3. Floating Draggable Screen Share PiP
- **Draggable Window**: Grab and reposition the floating "Your Screen" PiP anywhere across the viewport.
- **Theater / Fullscreen Modes**: Clean UI without distracting flashing indicators.

### 🎙️ 4. Echo-Cancelled Voice Notes & Web Audio Chimes
- **Acoustic Echo Cancellation**: Hardware-accelerated WebRTC audio constraints (`echoCancellation: true`, `noiseSuppression: true`, `autoGainControl: true`) to eliminate feedback loops and speaker reverberation.
- **Gentle Apple Chimes**: Synthesized pure sine dual-tone chords (880Hz → 1320Hz) via Web Audio API (0 KB network overhead).

### 📑 5. Synchronized Slide Presenter Studio
- **Cross-Peer Relay Upload**: Slides upload to cloud relay so all students view identical slides in sync.
- **Slide Management**: 1-tap slide deletion from thumbnail strip and 1-tap "Clear Entire Deck".
- **Live Slide Annotations**: Draw on slides with Pen, Highlighter, Eraser, and Glowing Red Laser Pointer.

### ⏱️ 6. Synchronized Classroom Timer
- Synchronized countdown timer with quick presets (2m, 5m, 10m, 15m), custom labels, auto-closing modal, and prominent glowing countdown badge in the room header.

### 📊 7. Live Polls & Q&A Queue
- **Live Polls**: Real-time vote percentage bars, single-choice voting, creator/faculty poll deletion, and lock options.
- **Anonymous Q&A**: Upvoting system, instructor answer threads, and answered status filters.

### 📁 8. P2P Direct File Transfers & "Share in Chat"
- **WebRTC DataChannels**: Multi-megabyte files transfer direct peer-to-peer at local Wi-Fi / gigabit speeds without passing through server disks.
- **Share in Chat**: 1-tap button on file cards to post download references straight into chat.

### 🛡️ 9. Faculty Moderation & Institutional Controls
- Unlock faculty controls with a secure room passphrase.
- Toggle whole-room chat mute, pin emergency announcements, kick disruptive users, and initiate room termination.

### 🌓 10. Apple Design Language & Full Dark Mode
- Polished typography, iOS-style blur materials, smooth transitions, and seamless Light/Dark mode switching.

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
│ (Faculty & Students)   │    ┌──────────────────────────┐
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
    │  • Auto-TTL Self-Destruct │                  │  • Lecture Digest Synth   │
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
# Install workspace dependencies for both client and server
npm install
```

### 3. Configure Environment Variables
Create your `.env` in `server/`:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=3001
CORS_ORIGIN=*
FACULTY_PASSPHRASE=faculty123

# Optional: Nebius DeepSeek-V4 AI API Key
NEBIUS_API_KEY=your_nebius_api_key_here
NEBIUS_BASE_URL=https://api.tokenfactory.us-central1.nebius.com/v1/
NEBIUS_MODEL=deepseek-ai/DeepSeek-V4-Flash
```

### 4. Run Locally in Development Mode
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
3. Set the following settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: `3001` (or provided by host)
     - `FACULTY_PASSPHRASE`: `your_secure_passphrase`
     - `NEBIUS_API_KEY`: `your_nebius_api_key`
     - `CORS_ORIGIN`: `*` (or your Netlify domain)
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

### Option B: Monolithic Single-Container Deployment (Docker / VPS / Render)

You can run both client and server from a single Node process:

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

## 📁 Repository Structure

```
ichatworld/
├── .env.example             # Root example environment configuration
├── .gitignore               # Comprehensive gitignore for root and workspaces
├── netlify.toml             # Netlify deployment configuration
├── package.json             # Root workspace orchestration
├── README.md                # Project documentation
│
├── client/                  # Frontend SPA (React + TypeScript + Vite + Tailwind)
│   ├── public/              # Static assets, icons, _redirects
│   ├── src/
│   │   ├── components/      # UI components (Home, Room, Whiteboard, Presenter, etc.)
│   │   ├── hooks/           # Custom React hooks (useSocket, useFileTransfer)
│   │   ├── types/           # Client TypeScript interfaces
│   │   ├── utils/           # WebRTC manager, formatters, Web Audio chimes
│   │   ├── App.tsx          # Main application container
│   │   └── main.tsx         # Entry point
│   ├── vite.config.ts       # Vite bundler & proxy configuration
│   └── package.json
│
└── server/                  # Backend Engine (Node.js + Express + Socket.io + Redis)
    ├── src/
    │   ├── routes/          # REST & Relay endpoints
    │   ├── services/        # Nebius DeepSeek AI service
    │   ├── socket/          # WebSocket event handlers (room, chat, rtc)
    │   ├── store/           # Memory & Redis ephemeral storage engines
    │   ├── types/           # Server TypeScript interfaces
    │   ├── config.ts        # Environment configuration
    │   └── server.ts        # Express & Socket.io server entry
    ├── scripts/             # Integration & stress test suites
    └── package.json
```

---

## 🧪 Testing

Run test suites:

```bash
# Test all classroom tools (Whiteboard, Screen Share, Code Pad, Timer, Q&A, Slides)
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

Developed with ❤️ by **[Pawan Joshi](https://github.com/pwnjoshi)**  
GitHub: [@pwnjoshi](https://github.com/pwnjoshi)
