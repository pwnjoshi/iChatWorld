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
  console.log('=== STARTING MESSAGE EDIT/DELETE & FILE REMOVAL VERIFICATION ===\n');

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

  const TEST_PORT = 3130;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  const serverUrl = `http://localhost:${TEST_PORT}`;

  try {
    // 1. Setup Room with Faculty & Student
    const facultySocket = Client(serverUrl, { transports: ['websocket'] });
    await new Promise<void>((res) => facultySocket.on('connect', res));
    const createRes: any = await new Promise((resolve) => {
      facultySocket.emit('room:create', { displayName: 'Prof. Davis', isFaculty: true, passphrase: CONFIG.FACULTY_PASSPHRASE }, resolve);
    });
    const roomCode = createRes.room.code;

    const studentSocket = Client(serverUrl, { transports: ['websocket'] });
    await new Promise<void>((res) => studentSocket.on('connect', res));
    await new Promise((resolve) => {
      studentSocket.emit('room:join', { code: roomCode, displayName: 'Charlie' }, resolve);
    });
    console.log(`[Setup] Connected to room ${roomCode}.`);

    // Test 1: Message Editing by Author
    console.log('\n[Test 1] Testing Message Editing...');
    const sendRes: any = await new Promise((resolve) => {
      studentSocket.emit('chat:send', { text: 'Initial typoo' }, resolve);
    });
    const msgId = sendRes.message.id;

    let facultyReceivedEdit = false;
    facultySocket.on('chat:message-updated', (m) => {
      if (m.id === msgId && m.isEdited && m.text === 'Fixed typo!') {
        facultyReceivedEdit = true;
      }
    });

    const editRes: any = await new Promise((resolve) => {
      studentSocket.emit('chat:edit', { messageId: msgId, text: 'Fixed typo!' }, resolve);
    });
    if (!editRes.success || !editRes.message.isEdited) throw new Error('Message edit failed');
    await new Promise(r => setTimeout(r, 100));
    if (!facultyReceivedEdit) throw new Error('Edited message not broadcasted to peer');
    console.log('✅ Test 1 Passed: Message editing & (edited) flag sync verified.');

    // Test 2: Message Soft-Deletion by Author (WhatsApp style)
    console.log('\n[Test 2] Testing Message Soft-Deletion by Author...');
    let facultyReceivedDelete = false;
    facultySocket.on('chat:message-updated', (m) => {
      if (m.id === msgId && m.isDeleted && m.text.includes('This message was deleted')) {
        facultyReceivedDelete = true;
      }
    });

    const delRes: any = await new Promise((resolve) => {
      studentSocket.emit('chat:delete', { messageId: msgId }, resolve);
    });
    if (!delRes.success || !delRes.message.isDeleted) throw new Error('Message delete failed');
    await new Promise(r => setTimeout(r, 100));
    if (!facultyReceivedDelete) throw new Error('Deleted message placeholder not broadcasted to peer');
    console.log('✅ Test 2 Passed: Author soft-deletion placeholder verified.');

    // Test 3: Moderator Deletion of Inappropriate Message by Faculty
    console.log('\n[Test 3] Testing Moderator Deletion by Faculty/Host...');
    const spamMsg: any = await new Promise((resolve) => {
      studentSocket.emit('chat:send', { text: 'Spam or inappropriate question' }, resolve);
    });
    const spamId = spamMsg.message.id;

    const modDeleteRes: any = await new Promise((resolve) => {
      facultySocket.emit('chat:delete', { messageId: spamId }, resolve);
    });
    if (!modDeleteRes.success || !modDeleteRes.message.isDeleted || modDeleteRes.message.deletedBy !== 'admin') {
      throw new Error('Moderator deletion failed');
    }
    console.log('✅ Test 3 Passed: Faculty/Admin moderator deletion verified.');

    // Test 4: File Deletion by Uploader
    console.log('\n[Test 4] Testing File Deletion by Uploader...');
    const fileAnnounceRes: any = await new Promise((resolve) => {
      studentSocket.emit('file:announce', {
        filename: 'notes.pdf',
        size: 2048,
        mimeType: 'application/pdf',
        transferMode: 'p2p'
      }, resolve);
    });
    const fileId = fileAnnounceRes.fileMeta.id;

    let facultyReceivedFileDelete = false;
    facultySocket.on('file:deleted', (data) => {
      if (data.fileId === fileId) facultyReceivedFileDelete = true;
    });

    const fileDelRes: any = await new Promise((resolve) => {
      studentSocket.emit('file:delete', { fileId }, resolve);
    });
    if (!fileDelRes.success) throw new Error('File delete failed');
    await new Promise(r => setTimeout(r, 100));
    if (!facultyReceivedFileDelete) throw new Error('File delete not broadcasted to room');
    console.log('✅ Test 4 Passed: File removal and broadcast verified.');

    facultySocket.disconnect();
    studentSocket.disconnect();

    console.log('\n======================================================');
    console.log('🎉 ALL 4 MESSAGE & FILE MANAGEMENT TESTS PASSED (4/4)!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TESTS FAILED:', err);
  process.exit(1);
});
