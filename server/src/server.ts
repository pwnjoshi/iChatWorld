import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './config.js';
import roomRouter from './routes/room.js';
import relayRouter from './routes/relay.js';
import { emailRouter } from './routes/emailRoutes.js';
import { registerRoomHandlers } from './socket/roomHandlers.js';
import { registerChatHandlers } from './socket/chatHandlers.js';
import { registerSignalingHandlers } from './socket/rtcSignaling.js';

const app = express();
const server = http.createServer(app);

// Security Headers & CORS Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), display-capture=(self)');
  next();
});

app.use(cors({
  origin: CONFIG.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Fallback binary relay route (before express.json)
app.use('/api/relay', relayRouter);

app.use(express.json({ limit: '25mb' })); // Support base64 image snapshots

// REST Routes
app.use('/api/rooms', roomRouter);
app.use('/api/email', emailRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Locate client/dist path (handles running from root or from server dir)
const possiblePaths = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist')
];
const clientDistPath = possiblePaths.find(p => fs.existsSync(p));

if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: CONFIG.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 1e8 // 100MB
});

io.on('connection', (socket) => {
  registerRoomHandlers(io, socket);
  registerChatHandlers(io, socket);
  registerSignalingHandlers(io, socket);
});

// Start Server
server.listen(CONFIG.PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 iChatWorld Server running on port ${CONFIG.PORT}`);
  console.log(`📡 WebSocket ready with WebRTC signaling`);
  console.log(`🔒 Ephemeral self-destruct store active`);
  if (clientDistPath) {
    console.log(`🌐 Serving client from: ${clientDistPath}`);
  }
  console.log(`=========================================`);
});
