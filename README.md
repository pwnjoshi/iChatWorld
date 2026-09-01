# iChatWorld — Ephemeral Workspaces for Real-Time Collaboration

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P%20Streaming-FF6B6B?logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![HugeIcons](https://img.shields.io/badge/HugeIcons-React-007AFF)](https://hugeicons.com/)
[![Resend](https://img.shields.io/badge/Email-Resend%20API-black?logo=resend&logoColor=white)](https://resend.com/)
[![DeepSeek-V4](https://img.shields.io/badge/AI-DeepSeek--V4--Flash-007AFF)](https://tokenfactory.nebius.com/)

> **Zero accounts. No tracking. Ephemeral self-destructing rooms.**  
> A fast, disposable workspace for live chat, direct WebRTC gigabit file drops, StarNote collaborative whiteboard studio, and presentation tools for teams, labs, study groups, hackathons, and workshops.

---

## 🌟 Core Capabilities

### 🎨 1. StarNote Collaborative Whiteboard Studio
- **6-Pen Studio Suite**: Fude/Fountain Pen, Natural Ink Pen, 2B Sketch Pencil with tilt/pressure shading, Ballpoint Pen, Art Brush, and Luminous Marker.
- **StarNote Floating Pen Box (Dock)**: Customizable quick-access pen tray with miniature 3D nib renderings and 1-tap preset activation.
- **4-in-1 Multi-Eraser Suite**: Standard Brush Eraser, 1-Click Object/Shape Eraser, Highlighter-Only Eraser, and Lasso Area Eraser.
- **Shape Select & Move Tool**: Click and drag any drawn stroke, geometric shape, or diagram anywhere on the canvas.
- **Inline Text & Labeling Tool**: Place text notes, equations, and annotations directly on the whiteboard.
- **Live Remote Stylus Cursors & Author Badges**: Real-time Apple-style pointer dots with author name tags (`[Prof. Alex ✍️]`) and drawing ripples.
- **Ultra-Low Bandwidth Engine**: Redundant jitter decimation ($< 1.5\text{px}$) and 40ms throttled broadcasts reduce network payload sizes by over 60%.
- **True Immersive Fullscreen**: Full-screen canvas viewport with frosted-glass controls and `Esc` shortcut.

### ✉️ 2. Export Notes & Homework via Resend OTP
- **6-Digit Cryptographic OTP Verification**: Dispatches one-time verification codes using Resend API to verify recipient ownership.
- **Customizable Export Bundle**: Send whiteboard diagrams (PNG), chat transcripts (MD), uploaded files, and custom instructor notes in one package.

### 💬 3. Live Ephemeral Chat & In-Room @ai Assistant
- **In-Room `@ai` Assistant**: Type `@ai <prompt>` in chat for instant peer tutoring, code analysis, and conceptual explanations powered by Nebius DeepSeek-V4-Flash.
- **Voice Notes & Code Blocks**: Clean voice recording with hardware-grade acoustic echo cancellation and syntax-highlighted code blocks with tapback reactions.

### 📁 4. Direct WebRTC P2P File Transfers
- **Direct Mesh Streaming**: Multi-megabyte files stream directly peer-to-peer over local Wi-Fi / gigabit network without passing through or persisting on server disks.
- **Share in Chat**: 1-tap button to post instant download references into the active chat stream.

### 📑 5. Synchronized Slide Presenter & Laser
- **Cloud Relay Sync**: Upload presentation slide decks with real-time synchronized slide transitions across all participants.
- **Live Annotations**: Draw on slides with pen, highlighter, eraser, and glowing red laser pointer dot tracking.

### ⏱️ 6. Prominent Synchronized Focus Timer Island
- **Room-Wide Island Banner**: Active countdown island pinned beneath the header with real-time sync, pause/resume, and "Time's Up! ⏰" alerts.
- **Live Polls & Q&A Queue**: Real-time anonymous Q&A queue with upvoting and live voting polls.

### 🛡️ 7. Host Moderation Controls & Custom Room Lifespan
- **Configurable Room Lifespan**: Select room auto-disposal timer from 1h, 3h, 6h, 12h, 24h, up to 48 hours.
- **Moderation Controls**: Unlock host tools with a passphrase: whole-room chat mute, pinned announcements, and member removal.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   iChatWorld Client                    │
│   (React 18 + Vite + Tailwind CSS + HugeIcons React)   │
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
    │  Ephemeral Store Engine   │                  │  Resend & Nebius AI API   │
    │  • In-Memory Map (Default)│                  │  • 6-Digit OTP Delivery   │
    │  • Redis Cloud (Optional) │                  │  • In-Room @ai Assistant  │
    │  • 1h - 48h Auto-Disposal │                  │  • Markdown Notes Export  │
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

# Resend Email Delivery for OTP & Notes Export
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev

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

## 📦 Production Build & Deployment

### Build for Production
```bash
npm run build
```

### Run Production Server
```bash
npm start
```

---

## 📄 License
This project is open-source under the **MIT License**.
