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
  console.log('=== STARTING QA THREADING & WHITEBOARD PRESSURE VERIFICATION ===\n');

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

  const TEST_PORT = 3140;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  const serverUrl = `http://localhost:${TEST_PORT}`;

  try {
    // Setup Faculty and Student
    const facultySocket = Client(serverUrl, { transports: ['websocket'] });
    await new Promise<void>((res) => facultySocket.on('connect', res));
    const createRes: any = await new Promise((resolve) => {
      facultySocket.emit('room:create', { displayName: 'Dr. Evans', isFaculty: true, passphrase: CONFIG.FACULTY_PASSPHRASE }, resolve);
    });
    const roomCode = createRes.room.code;

    const studentSocket = Client(serverUrl, { transports: ['websocket'] });
    await new Promise<void>((res) => studentSocket.on('connect', res));
    await new Promise((resolve) => {
      studentSocket.emit('room:join', { code: roomCode, displayName: 'Eva' }, resolve);
    });
    console.log(`[Setup] Connected to room ${roomCode}.`);

    // Test 1: Ask Question & Edit Question by Author
    console.log('\n[Test 1] Testing Question Creation & Editing by Author...');
    const askRes: any = await new Promise((resolve) => {
      studentSocket.emit('qa:ask', { text: 'How do we solve Problem 4?', isAnonymous: true }, resolve);
    });
    if (!askRes.success || !askRes.question) throw new Error('Ask question failed');
    const qId = askRes.question.id;

    let facultyReceivedEdit = false;
    facultySocket.on('qa:question-updated', (q) => {
      if (q.id === qId && q.isEdited && q.text === 'How do we solve Problem 4 with dynamic programming?') {
        facultyReceivedEdit = true;
      }
    });

    const editRes: any = await new Promise((resolve) => {
      studentSocket.emit('qa:edit', { questionId: qId, text: 'How do we solve Problem 4 with dynamic programming?' }, resolve);
    });
    if (!editRes.success || !editRes.question.isEdited) throw new Error('Question edit failed');
    await new Promise(r => setTimeout(r, 100));
    if (!facultyReceivedEdit) throw new Error('Question edit not synced');
    console.log('✅ Test 1 Passed: Question ask and author edit verified.');

    // Test 2: Answering Question by Peer (Anyone can answer)
    console.log('\n[Test 2] Testing Answer Submission by Peer...');
    let studentReceivedAnswer = false;
    studentSocket.on('qa:question-updated', (q) => {
      if (q.id === qId && q.answers?.some(a => a.text === 'Use memoization with a hash table.')) {
        studentReceivedAnswer = true;
      }
    });

    const ansRes: any = await new Promise((resolve) => {
      facultySocket.emit('qa:answer', { questionId: qId, text: 'Use memoization with a hash table.' }, resolve);
    });
    if (!ansRes.success || !ansRes.question.answers || ansRes.question.answers.length === 0) {
      throw new Error('Answer submission failed');
    }
    const answerId = ansRes.question.answers[0].id;
    await new Promise(r => setTimeout(r, 100));
    if (!studentReceivedAnswer) throw new Error('Peer answer not broadcasted');
    console.log('✅ Test 2 Passed: Anyone/Peer answer submission verified.');

    // Test 3: Upvoting Answer
    console.log('\n[Test 3] Testing Upvote Answer...');
    const upvoteAnsRes: any = await new Promise((resolve) => {
      studentSocket.emit('qa:upvote-answer', { questionId: qId, answerId }, resolve);
    });
    if (!upvoteAnsRes.success || upvoteAnsRes.question.answers[0].upvotes.length !== 2) {
      throw new Error('Answer upvote failed');
    }
    console.log('✅ Test 3 Passed: Answer upvoting verified.');

    // Test 4: Whiteboard Stroke with Stylus Pressure
    console.log('\n[Test 4] Testing Pressure-Sensitive Whiteboard Stroke...');
    let studentReceivedStroke = false;
    studentSocket.on('whiteboard:stroke-received', (stroke) => {
      if (stroke.points?.[0]?.pressure === 0.85) studentReceivedStroke = true;
    });

    facultySocket.emit('whiteboard:stroke', {
      id: 'stroke-p1',
      type: 'pen',
      color: '#34C759',
      size: 4,
      points: [
        { x: 50, y: 50, pressure: 0.85 },
        { x: 75, y: 75, pressure: 0.65 }
      ]
    });
    await new Promise(r => setTimeout(r, 100));
    if (!studentReceivedStroke) throw new Error('Pressure stroke not received');
    console.log('✅ Test 4 Passed: Stylus pressure stroke verified.');

    facultySocket.disconnect();
    studentSocket.disconnect();

    console.log('\n======================================================');
    console.log('🎉 ALL QA THREADING & WHITEBOARD TESTS PASSED (4/4)!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TESTS FAILED:', err);
  process.exit(1);
});
