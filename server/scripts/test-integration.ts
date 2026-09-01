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
  console.log('=== STARTING EXTENDED ICHATWORLD INTEGRATION TESTS ===\n');

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

  const TEST_PORT = 3105;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  const serverUrl = `http://localhost:${TEST_PORT}`;

  let createdRoomCode1 = '';
  let createdRoomCode2 = '';

  try {
    // 1. Create Room 1 as Faculty
    console.log('[Test 1] Creating Room 1 as Faculty...');
    const creatorSocket = Client(serverUrl, { transports: ['websocket'] });
    await new Promise<void>((res) => creatorSocket.on('connect', res));

    const createRes1: any = await new Promise((resolve) => {
      creatorSocket.emit('room:create', { displayName: 'Prof Smith', isFaculty: true, passphrase: CONFIG.FACULTY_PASSPHRASE }, resolve);
    });
    if (!createRes1.success) throw new Error(`Room 1 creation failed: ${createRes1.error}`);
    createdRoomCode1 = createRes1.room.code;
    console.log(`✅ Test 1 Passed: Room 1 created with code "${createdRoomCode1}".`);

    // 2. Student joins Room 1
    console.log('\n[Test 2] Student joins Room 1...');
    const studentSocket = Client(serverUrl, { transports: ['websocket'] });
    await new Promise<void>((res) => studentSocket.on('connect', res));

    const joinRes1: any = await new Promise((resolve) => {
      studentSocket.emit('room:join', { code: createdRoomCode1, displayName: 'Alice' }, resolve);
    });
    if (!joinRes1.success) throw new Error(`Student join failed: ${joinRes1.error}`);
    console.log('✅ Test 2 Passed: Student joined Room 1.');

    // 3. Test Tapback Emoji Reactions
    console.log('\n[Test 3] Testing Tapback Emoji Reactions...');
    const msgRes: any = await new Promise((resolve) => {
      creatorSocket.emit('chat:send', { text: 'Welcome to Advanced Calculus!' }, resolve);
    });
    if (!msgRes.success) throw new Error('Message sending failed');
    const msgId = msgRes.message.id;

    // Student reacts with 👍
    let studentReceivedReaction = false;
    creatorSocket.on('chat:message-updated', (updatedMsg) => {
      if (updatedMsg.id === msgId && updatedMsg.reactions?.['👍']) {
        studentReceivedReaction = true;
      }
    });

    const reactRes: any = await new Promise((resolve) => {
      studentSocket.emit('chat:react', { messageId: msgId, emoji: '👍' }, resolve);
    });
    if (!reactRes.success || reactRes.message.reactions['👍'].count !== 1) {
      throw new Error('Reaction failed');
    }
    await new Promise(r => setTimeout(r, 100));
    if (!studentReceivedReaction) throw new Error('Reaction broadcast not received');
    console.log('✅ Test 3 Passed: Tapback reaction registered and synced.');

    // 4. Test Hand Raising Queue
    console.log('\n[Test 4] Testing Classroom Hand Raising Queue...');
    let facultyReceivedHand = false;
    creatorSocket.on('room:hands-updated', (data) => {
      if (data.handsRaised.some((h: any) => h.displayName === 'Alice')) {
        facultyReceivedHand = true;
      }
    });

    const raiseRes: any = await new Promise((resolve) => {
      studentSocket.emit('hand:raise', {}, resolve);
    });
    if (!raiseRes.success || raiseRes.handsRaised.length !== 1) {
      throw new Error('Hand raise failed');
    }
    await new Promise(r => setTimeout(r, 100));
    if (!facultyReceivedHand) throw new Error('Faculty did not receive hand raise notification');

    // Faculty lowers student's hand
    const lowerRes: any = await new Promise((resolve) => {
      creatorSocket.emit('hand:lower', { targetSocketId: studentSocket.id }, resolve);
    });
    if (!lowerRes.success || lowerRes.handsRaised.length !== 0) {
      throw new Error('Faculty lower hand failed');
    }
    console.log('✅ Test 4 Passed: Hand raising and faculty queue acknowledged.');

    // 5. Test Live Classroom Polls
    console.log('\n[Test 5] Testing Live Polls...');
    let studentReceivedPoll = false;
    studentSocket.on('poll:created', () => {
      studentReceivedPoll = true;
    });

    const pollRes: any = await new Promise((resolve) => {
      creatorSocket.emit('poll:create', {
        question: 'Ready for the quiz?',
        options: ['Yes, ready!', 'Need 5 minutes']
      }, resolve);
    });
    if (!pollRes.success || !pollRes.poll?.id) {
      throw new Error('Poll creation failed');
    }
    const pollId = pollRes.poll.id;
    const option1Id = pollRes.poll.options[0].id;

    // Student votes on option 1
    const voteRes: any = await new Promise((resolve) => {
      studentSocket.emit('poll:vote', { pollId, optionId: option1Id }, resolve);
    });
    if (!voteRes.success || voteRes.poll.totalVotes !== 1) {
      throw new Error('Poll voting failed');
    }

    // Faculty ends poll
    const closeRes: any = await new Promise((resolve) => {
      creatorSocket.emit('poll:close', { pollId }, resolve);
    });
    if (!closeRes.success || closeRes.poll.isOpen !== false) {
      throw new Error('Poll closing failed');
    }
    console.log('✅ Test 5 Passed: Live poll created, voted, and closed.');

    // 6. Test Multi-Room Fast Switching
    console.log('\n[Test 6] Testing Multi-Room Switching...');
    // Create Room 2
    const secondCreatorSocket = Client(serverUrl, { transports: ['websocket'] });
    await new Promise<void>((res) => secondCreatorSocket.on('connect', res));
    const createRes2: any = await new Promise((resolve) => {
      secondCreatorSocket.emit('room:create', { displayName: 'Prof Physics', isFaculty: true, passphrase: CONFIG.FACULTY_PASSPHRASE }, resolve);
    });
    createdRoomCode2 = createRes2.room.code;

    // Alice switches from Room 1 to Room 2
    const switchRes: any = await new Promise((resolve) => {
      studentSocket.emit('room:switch', { targetCode: createdRoomCode2, displayName: 'Alice' }, resolve);
    });
    if (!switchRes.success || switchRes.room.code !== createdRoomCode2) {
      throw new Error(`Room switch to ${createdRoomCode2} failed`);
    }

    // Alice sends message in Room 2
    const msg2Res: any = await new Promise((resolve) => {
      studentSocket.emit('chat:send', { text: 'Joined Physics session!' }, resolve);
    });
    if (!msg2Res.success) throw new Error('Message in switched room failed');
    console.log(`✅ Test 6 Passed: Alice switched from ${createdRoomCode1} to ${createdRoomCode2} and posted.`);

    // 7. Cleanup
    creatorSocket.disconnect();
    studentSocket.disconnect();
    secondCreatorSocket.disconnect();

    console.log('\n=========================================');
    console.log('🎉 ALL 6 NEW FEATURE TESTS PASSED (6/6)!');
    console.log('=========================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ INTEGRATION TESTS FAILED:', err);
  process.exit(1);
});
