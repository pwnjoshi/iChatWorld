import http from 'http';
import { io as Client } from 'socket.io-client';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { CONFIG } from '../src/config.js';
import roomRouter from '../src/routes/room.js';
import relayRouter from '../src/routes/relay.js';
import { registerRoomHandlers } from '../src/socket/roomHandlers.js';
import { registerChatHandlers } from '../src/socket/chatHandlers.js';
import { registerSignalingHandlers } from '../src/socket/rtcSignaling.js';

async function runTests() {
  console.log('=== STARTING 7 CLASSROOM TOOLS AUTOMATED VERIFICATION ===\n');

  const app = express();
  app.use(cors());
  app.use('/api/relay', relayRouter);
  app.use(express.json());
  app.use('/api/rooms', roomRouter);

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerSignalingHandlers(io, socket);
  });

  const TEST_PORT = 3120;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  const serverUrl = `http://localhost:${TEST_PORT}`;

  try {
    // 1. Create Room as Faculty & Connect Student
    const facultySocket = Client(serverUrl, { transports: ['websocket'] });
    await new Promise<void>((res) => facultySocket.on('connect', res));
    const createRes: any = await new Promise((resolve) => {
      facultySocket.emit('room:create', { displayName: 'Dr. Johnson', isFaculty: true, passphrase: CONFIG.FACULTY_PASSPHRASE }, resolve);
    });
    const roomCode = createRes.room.code;

    const studentSocket = Client(serverUrl, { transports: ['websocket'] });
    await new Promise<void>((res) => studentSocket.on('connect', res));
    await new Promise((resolve) => {
      studentSocket.emit('room:join', { code: roomCode, displayName: 'Bob' }, resolve);
    });
    console.log(`[Setup] Faculty and Student connected to room ${roomCode}.`);

    // Tool 1: Collaborative Whiteboard
    console.log('\n[Tool 1] Testing Collaborative Whiteboard...');
    let studentReceivedStroke = false;
    studentSocket.on('whiteboard:stroke-received', (stroke) => {
      if (stroke.id === 'stroke-1') studentReceivedStroke = true;
    });

    facultySocket.emit('whiteboard:stroke', {
      id: 'stroke-1',
      type: 'pen',
      color: '#007AFF',
      size: 4,
      points: [{ x: 10, y: 10 }, { x: 20, y: 20 }]
    });

    await new Promise(r => setTimeout(r, 100));
    if (!studentReceivedStroke) throw new Error('Whiteboard stroke not received by peer');

    let studentReceivedClear = false;
    studentSocket.on('whiteboard:cleared', () => {
      studentReceivedClear = true;
    });
    facultySocket.emit('whiteboard:clear');
    await new Promise(r => setTimeout(r, 100));
    if (!studentReceivedClear) throw new Error('Whiteboard clear not received');
    console.log('✅ Tool 1 Passed: Whiteboard stroke sync & canvas clear verified.');

    // Tool 2: Screen Sharing Signaling
    console.log('\n[Tool 2] Testing Screen Sharing Signaling...');
    let studentReceivedScreenStart = false;
    studentSocket.on('screen:stream-started', (data) => {
      if (data.presenterName === 'Dr. Johnson') studentReceivedScreenStart = true;
    });
    facultySocket.emit('screen:start', { presenterName: 'Dr. Johnson' });
    await new Promise(r => setTimeout(r, 100));
    if (!studentReceivedScreenStart) throw new Error('Screen sharing notification not received');
    console.log('✅ Tool 2 Passed: Screen share stream notification verified.');

    // Tool 3: Code Pad Snippet Sharing
    console.log('\n[Tool 3] Testing Code Pad Snippet in Chat...');
    let studentReceivedCode = false;
    studentSocket.on('chat:received', (msg) => {
      if (msg.isCode && msg.codeLanguage === 'python') studentReceivedCode = true;
    });
    facultySocket.emit('chat:send', {
      text: 'print("Hello World")',
      isCode: true,
      codeLanguage: 'python'
    });
    await new Promise(r => setTimeout(r, 100));
    if (!studentReceivedCode) throw new Error('Code snippet chat message not received');
    console.log('✅ Tool 3 Passed: Code snippet message verified.');

    // Tool 4: Synchronized Classroom Timer
    console.log('\n[Tool 4] Testing Synchronized Classroom Timer...');
    let studentReceivedTimer = false;
    studentSocket.on('room:timer-updated', (timer) => {
      if (timer && timer.durationSec === 300) studentReceivedTimer = true;
    });

    const timerRes: any = await new Promise((resolve) => {
      facultySocket.emit('timer:update', {
        durationSec: 300,
        remainingSec: 300,
        isRunning: true,
        startedAt: Date.now(),
        label: 'Quiz 1'
      }, resolve);
    });
    if (!timerRes.success) throw new Error('Timer update failed');
    await new Promise(r => setTimeout(r, 100));
    if (!studentReceivedTimer) throw new Error('Timer state not synchronized with student');
    console.log('✅ Tool 4 Passed: Synchronized classroom countdown timer verified.');

    // Tool 5: Anonymous Q&A and Upvoting
    console.log('\n[Tool 5] Testing Anonymous Q&A and Upvoting...');
    let facultyReceivedQ = false;
    facultySocket.on('qa:question-added', (q) => {
      if (q.isAnonymous && q.authorName === 'Anonymous Student') facultyReceivedQ = true;
    });

    const qaRes: any = await new Promise((resolve) => {
      studentSocket.emit('qa:ask', { text: 'Will this be on the midterm?', isAnonymous: true }, resolve);
    });
    if (!qaRes.success || !qaRes.question?.id) throw new Error('QA ask failed');
    const qId = qaRes.question.id;

    await new Promise(r => setTimeout(r, 100));
    if (!facultyReceivedQ) throw new Error('Faculty did not receive anonymous question');

    // Faculty upvotes question
    const upvoteRes: any = await new Promise((resolve) => {
      facultySocket.emit('qa:upvote', { questionId: qId }, resolve);
    });
    if (!upvoteRes.success || upvoteRes.question.upvotes.length !== 2) {
      throw new Error('QA upvote failed');
    }

    // Faculty marks as answered
    const answerRes: any = await new Promise((resolve) => {
      facultySocket.emit('qa:toggle-answer', { questionId: qId }, resolve);
    });
    if (!answerRes.success || answerRes.question.isAnswered !== true) {
      throw new Error('QA answer toggle failed');
    }
    console.log('✅ Tool 5 Passed: Anonymous question, upvoting, and answered status verified.');

    // Tool 6: Synchronized Slide Deck & Laser Pointer
    console.log('\n[Tool 6] Testing Slide Presenter & Laser Pointer...');
    let studentReceivedSlide = false;
    studentSocket.on('room:presenter-updated', (p) => {
      if (p.currentSlide === 2) studentReceivedSlide = true;
    });
    const presenterRes: any = await new Promise((resolve) => {
      facultySocket.emit('presenter:sync', {
        active: true,
        presenterId: facultySocket.id,
        presenterName: 'Dr. Johnson',
        currentSlide: 2,
        totalSlides: 10
      }, resolve);
    });
    if (!presenterRes.success) throw new Error('Presenter sync failed');
    await new Promise(r => setTimeout(r, 100));
    if (!studentReceivedSlide) throw new Error('Student did not receive slide change');

    let studentReceivedLaser = false;
    studentSocket.on('presenter:laser-moved', (pos) => {
      if (pos.x === 50 && pos.y === 60) studentReceivedLaser = true;
    });
    facultySocket.emit('presenter:laser-move', { x: 50, y: 60 });
    await new Promise(r => setTimeout(r, 100));
    if (!studentReceivedLaser) throw new Error('Laser pointer coordinate not received');
    console.log('✅ Tool 6 Passed: Synchronized slide flips & laser pointer tracking verified.');

    // Tool 7: PWA Manifest Verification
    console.log('\n[Tool 7] Testing PWA Manifest & Service Worker Registration...');
    const fs = await import('fs');
    const path = await import('path');
    const manifestPath = path.resolve(process.cwd(), '../client/public/manifest.json');
    const swPath = path.resolve(process.cwd(), '../client/public/sw.js');
    if (!fs.existsSync(manifestPath) || !fs.existsSync(swPath)) {
      throw new Error('PWA manifest.json or sw.js missing in client/public');
    }
    console.log('✅ Tool 7 Passed: PWA manifest and service worker verified.');

    facultySocket.disconnect();
    studentSocket.disconnect();

    console.log('\n======================================================');
    console.log('🎉 ALL 7 NEW CLASSROOM TOOLS VERIFIED SUCCESSFULLY (7/7)!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TOOL TESTS FAILED:', err);
  process.exit(1);
});
