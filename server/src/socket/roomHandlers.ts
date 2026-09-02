import { Server, Socket } from 'socket.io';
import { store } from '../store/index.js';
import { Member, HandRaise, Poll, WhiteboardStroke, QAQuestion, QAAnswer, ClassroomTimerState, PresenterState } from '../types/index.js';
import { CONFIG } from '../config.js';
import { aiService } from '../services/aiService.js';

export function generateRoomCode(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 3; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${part1}-${part2}`;
}

export function registerRoomHandlers(io: Server, socket: Socket) {
  // Create a new room
  socket.on('room:create', async (data: { displayName: string; isFaculty?: boolean; passphrase?: string; lifespanHours?: number }, callback) => {
    try {
      let code = generateRoomCode();
      let attempts = 0;
      while (await store.isRoomActive(code) && attempts < 5) {
        code = generateRoomCode();
        attempts++;
      }

      let isFaculty = !!data.isFaculty;
      if (isFaculty && data.passphrase) {
        if (data.passphrase.trim() !== CONFIG.FACULTY_PASSPHRASE) {
          isFaculty = false;
        }
      }

      const member: Member = {
        socketId: socket.id,
        displayName: (data.displayName || 'Creator').trim() || 'Creator',
        isFaculty,
        isCreator: true,
        joinedAt: Date.now()
      };

      const lifespanHours = typeof data.lifespanHours === 'number' ? data.lifespanHours : 24;
      const creatorSecret = `csec_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
      const room = await store.createRoom(code, member, undefined, lifespanHours, creatorSecret);
      socket.join(code);
      (socket as any).roomCode = code;
      (socket as any).memberData = member;

      if (typeof callback === 'function') {
        callback({ success: true, room, member, creatorSecret });
      }
    } catch (err: any) {
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // Join existing room
  socket.on('room:join', async (data: { code: string; displayName: string; isFaculty?: boolean; passphrase?: string; creatorSecret?: string }, callback) => {
    try {
      const code = (data.code || '').trim().toUpperCase();
      const existingRoom = await store.getRoom(code);

      if (!existingRoom) {
        if (typeof callback === 'function') {
          return callback({ success: false, error: 'Room not found or has expired' });
        }
        return;
      }

      let isFaculty = !!data.isFaculty;
      if (isFaculty && data.passphrase) {
        if (data.passphrase.trim() !== CONFIG.FACULTY_PASSPHRASE) {
          isFaculty = false;
        }
      }

      // Check if user has saved creatorSecret token from local storage
      const isRecognizedCreator = !!(existingRoom.creatorSecret && data.creatorSecret && existingRoom.creatorSecret === data.creatorSecret);

      const member: Member = {
        socketId: socket.id,
        displayName: (data.displayName || (isRecognizedCreator ? 'Creator' : 'Participant')).trim() || (isRecognizedCreator ? 'Creator' : 'Participant'),
        isFaculty: isFaculty || isRecognizedCreator,
        isCreator: isRecognizedCreator,
        joinedAt: Date.now()
      };

      const updatedRoom = await store.addMember(code, member);
      if (!updatedRoom) {
        if (typeof callback === 'function') {
          return callback({ success: false, error: 'Failed to join room' });
        }
        return;
      }

      socket.join(code);
      (socket as any).roomCode = code;
      (socket as any).memberData = member;

      socket.to(code).emit('room:member-joined', {
        member,
        room: updatedRoom
      });

      if (typeof callback === 'function') {
        callback({ success: true, room: updatedRoom, member, isCreator: isRecognizedCreator });
      }
    } catch (err: any) {
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // Switch between rooms
  socket.on('room:switch', async (data: { targetCode: string; displayName: string; isFaculty?: boolean }, callback) => {
    try {
      const targetCode = (data.targetCode || '').trim().toUpperCase();
      const targetRoom = await store.getRoom(targetCode);
      if (!targetRoom) {
        return callback && callback({ success: false, error: 'Target room has expired or does not exist' });
      }

      let member = targetRoom.members.find(m => m.socketId === socket.id);
      if (!member) {
        member = {
          socketId: socket.id,
          displayName: data.displayName || (socket as any).memberData?.displayName || 'User',
          isFaculty: !!data.isFaculty,
          isCreator: false,
          joinedAt: Date.now()
        };
        await store.addMember(targetCode, member);
      }

      socket.join(targetCode);
      (socket as any).roomCode = targetCode;
      (socket as any).memberData = member;

      const freshTargetRoom = await store.getRoom(targetCode);
      if (typeof callback === 'function') {
        callback({ success: true, room: freshTargetRoom, member });
      }
    } catch (err: any) {
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // Collaborative Whiteboard Stroke
  socket.on('whiteboard:stroke', async (stroke: WhiteboardStroke) => {
    const roomCode = (socket as any).roomCode;
    if (!roomCode) return;
    await store.addWhiteboardStroke(roomCode, stroke);
    socket.to(roomCode).emit('whiteboard:stroke-received', stroke);
  });

  // Clear Whiteboard
  socket.on('whiteboard:clear', async () => {
    const roomCode = (socket as any).roomCode;
    if (!roomCode) return;
    await store.clearWhiteboard(roomCode);
    io.to(roomCode).emit('whiteboard:cleared');
  });

  // Synchronized Classroom Timer
  socket.on('timer:update', async (timerState: ClassroomTimerState | null, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (!roomCode || (!member?.isFaculty && !member?.isCreator)) {
      return callback && callback({ success: false, error: 'Unauthorized' });
    }

    const updated = await store.setTimerState(roomCode, timerState);
    io.to(roomCode).emit('room:timer-updated', updated);
    if (typeof callback === 'function') callback({ success: true, timerState: updated });
  });

  // Anonymous / Named Q&A Question
  socket.on('qa:ask', async (data: { text: string; isAnonymous: boolean }, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (!roomCode || !member) return callback && callback({ success: false });

    const question: QAQuestion = {
      id: `qa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      authorId: socket.id,
      authorName: data.isAnonymous ? 'Anonymous Student' : member.displayName,
      isAnonymous: !!data.isAnonymous,
      text: data.text.trim(),
      timestamp: Date.now(),
      upvotes: [socket.id],
      isAnswered: false,
      answers: []
    };

    const created = await store.addQAQuestion(roomCode, question);
    io.to(roomCode).emit('qa:question-added', created);
    if (typeof callback === 'function') callback({ success: true, question: created });
  });

  // Upvote Question
  socket.on('qa:upvote', async (data: { questionId: string }, callback) => {
    const roomCode = (socket as any).roomCode;
    if (!roomCode) return callback && callback({ success: false });

    const updated = await store.upvoteQAQuestion(roomCode, data.questionId, socket.id);
    if (updated) {
      io.to(roomCode).emit('qa:question-updated', updated);
      if (typeof callback === 'function') callback({ success: true, question: updated });
    }
  });

  // Edit Question
  socket.on('qa:edit', async (data: { questionId: string; text: string }, callback) => {
    const roomCode = (socket as any).roomCode;
    if (!roomCode || !data.questionId || !data.text?.trim()) return callback && callback({ success: false });

    const updated = await store.editQAQuestion(roomCode, data.questionId, data.text.trim(), socket.id);
    if (updated) {
      io.to(roomCode).emit('qa:question-updated', updated);
      if (typeof callback === 'function') callback({ success: true, question: updated });
    } else {
      if (typeof callback === 'function') callback({ success: false, error: 'Cannot edit question' });
    }
  });

  // Delete Question (Author or Host/Faculty)
  socket.on('qa:delete', async (data: { questionId: string }, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (!roomCode || !data.questionId) return callback && callback({ success: false });

    const isFacultyOrHost = !!(member?.isFaculty || member?.isCreator);
    const deleted = await store.deleteQAQuestion(roomCode, data.questionId, socket.id, isFacultyOrHost);
    if (deleted) {
      io.to(roomCode).emit('qa:question-deleted', { questionId: data.questionId });
      if (typeof callback === 'function') callback({ success: true, questionId: data.questionId });
    } else {
      if (typeof callback === 'function') callback({ success: false, error: 'Cannot delete question' });
    }
  });

  // Post Answer to Question
  socket.on('qa:answer', async (data: { questionId: string; text: string }, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (!roomCode || !member || !data.questionId || !data.text?.trim()) {
      return callback && callback({ success: false });
    }

    const answer: QAAnswer = {
      id: `ans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      authorId: socket.id,
      authorName: member.displayName,
      isFaculty: !!member.isFaculty,
      text: data.text.trim(),
      timestamp: Date.now(),
      upvotes: [socket.id]
    };

    const updated = await store.addQAAnswer(roomCode, data.questionId, answer);
    if (updated) {
      io.to(roomCode).emit('qa:question-updated', updated);
      if (typeof callback === 'function') callback({ success: true, question: updated });
    } else {
      if (typeof callback === 'function') callback({ success: false, error: 'Question not found' });
    }
  });

  // Upvote Answer
  socket.on('qa:upvote-answer', async (data: { questionId: string; answerId: string }, callback) => {
    const roomCode = (socket as any).roomCode;
    if (!roomCode || !data.questionId || !data.answerId) return callback && callback({ success: false });

    const updated = await store.upvoteQAAnswer(roomCode, data.questionId, data.answerId, socket.id);
    if (updated) {
      io.to(roomCode).emit('qa:question-updated', updated);
      if (typeof callback === 'function') callback({ success: true, question: updated });
    }
  });

  // Mark QA as Answered
  socket.on('qa:toggle-answer', async (data: { questionId: string }, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (!roomCode || (!member?.isFaculty && !member?.isCreator)) {
      return callback && callback({ success: false, error: 'Unauthorized' });
    }

    const updated = await store.toggleAnswerQAQuestion(roomCode, data.questionId);
    if (updated) {
      io.to(roomCode).emit('qa:question-updated', updated);
      if (typeof callback === 'function') callback({ success: true, question: updated });
    }
  });

  // Synchronized Slide Presenter
  socket.on('presenter:sync', async (presenterState: PresenterState | null, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (!roomCode || (!member?.isFaculty && !member?.isCreator)) {
      return callback && callback({ success: false, error: 'Unauthorized' });
    }

    const updated = await store.setPresenterState(roomCode, presenterState);
    io.to(roomCode).emit('room:presenter-updated', updated);
    if (typeof callback === 'function') callback({ success: true, presenterState: updated });
  });

  // Presenter Slide Annotations (Pen / Marker / Highlighter on slides)
  socket.on('presenter:annotate', (data: { slideIndex: number; stroke: WhiteboardStroke }) => {
    const roomCode = (socket as any).roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('presenter:annotated', data);
    }
  });

  // Presenter Clear Annotations on Slide
  socket.on('presenter:clear-annotations', (data: { slideIndex: number }) => {
    const roomCode = (socket as any).roomCode;
    if (roomCode) {
      io.to(roomCode).emit('presenter:annotations-cleared', data);
    }
  });

  // Presenter Laser Pointer Position
  socket.on('presenter:laser-move', (pos: { x: number; y: number } | null) => {
    const roomCode = (socket as any).roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('presenter:laser-moved', pos);
    }
  });

  // Screen Sharing WebRTC Signaling
  socket.on('screen:start', (data: { presenterName: string }) => {
    const roomCode = (socket as any).roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('screen:stream-started', {
        presenterSocketId: socket.id,
        presenterName: data.presenterName
      });
    }
  });

  socket.on('screen:stop', () => {
    const roomCode = (socket as any).roomCode;
    if (roomCode) {
      io.to(roomCode).emit('screen:stream-stopped');
    }
  });

  // Raise Hand
  socket.on('hand:raise', async (_, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (!roomCode || !member) return callback && callback({ success: false });

    const hand: HandRaise = {
      socketId: socket.id,
      displayName: member.displayName,
      raisedAt: Date.now()
    };

    const hands = await store.raiseHand(roomCode, hand);
    io.to(roomCode).emit('room:hands-updated', { handsRaised: hands });

    if (typeof callback === 'function') callback({ success: true, handsRaised: hands });
  });

  // Lower Hand
  socket.on('hand:lower', async (data: { targetSocketId?: string }, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (!roomCode || !member) return callback && callback({ success: false });

    const targetSocketId = (member.isFaculty || member.isCreator) && data?.targetSocketId
      ? data.targetSocketId
      : socket.id;

    const hands = await store.lowerHand(roomCode, targetSocketId);
    io.to(roomCode).emit('room:hands-updated', { handsRaised: hands });

    if (typeof callback === 'function') callback({ success: true, handsRaised: hands });
  });

  // Lower All Hands
  socket.on('hand:lower-all', async (_, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (!roomCode || (!member?.isFaculty && !member?.isCreator)) {
      return callback && callback({ success: false, error: 'Unauthorized' });
    }

    await store.lowerAllHands(roomCode);
    io.to(roomCode).emit('room:hands-updated', { handsRaised: [] });

    if (typeof callback === 'function') callback({ success: true });
  });

  // Live Polls
  socket.on('poll:create', async (data: { question: string; options: string[] }, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (!roomCode || (!member?.isFaculty && !member?.isCreator)) {
      return callback && callback({ success: false, error: 'Unauthorized' });
    }

    if (!data.question || !data.options || data.options.length < 2) {
      return callback && callback({ success: false, error: 'Poll requires a question and at least 2 options' });
    }

    const poll: Poll = {
      id: `poll-${Date.now()}`,
      creatorId: socket.id,
      creatorName: member.displayName,
      question: data.question.trim(),
      options: data.options.map((optText, idx) => ({
        id: `opt-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        text: optText.trim(),
        votes: []
      })),
      createdAt: Date.now(),
      isOpen: true,
      totalVotes: 0
    };

    const createdPoll = await store.createPoll(roomCode, poll);
    io.to(roomCode).emit('poll:created', createdPoll);

    if (typeof callback === 'function') callback({ success: true, poll: createdPoll });
  });

  socket.on('poll:vote', async (data: { pollId: string; optionId: string }, callback) => {
    const roomCode = (socket as any).roomCode;
    if (!roomCode) return callback && callback({ success: false });

    const updatedPoll = await store.votePoll(roomCode, data.pollId, data.optionId, socket.id);
    if (updatedPoll) {
      io.to(roomCode).emit('poll:updated', updatedPoll);
      if (typeof callback === 'function') callback({ success: true, poll: updatedPoll });
    }
  });

  socket.on('poll:close', async (data: { pollId: string }, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (!roomCode || (!member?.isFaculty && !member?.isCreator)) {
      return callback && callback({ success: false, error: 'Unauthorized' });
    }

    const closedPoll = await store.closePoll(roomCode, data.pollId);
    if (closedPoll) {
      io.to(roomCode).emit('poll:updated', closedPoll);
      if (typeof callback === 'function') callback({ success: true, poll: closedPoll });
    }
  });

  // Delete Poll (Creator or Faculty/Host)
  socket.on('poll:delete', async (data: { pollId: string }, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (!roomCode || (!member?.isFaculty && !member?.isCreator)) {
      return callback && callback({ success: false, error: 'Unauthorized' });
    }

    const deleted = await store.deletePoll(roomCode, data.pollId);
    if (deleted) {
      io.to(roomCode).emit('poll:deleted', { pollId: data.pollId });
      if (typeof callback === 'function') callback({ success: true });
    } else {
      if (typeof callback === 'function') callback({ success: false, error: 'Poll not found' });
    }
  });

  // AI Lecture Summary Generation
  socket.on('ai:summarize', async (_, callback) => {
    const roomCode = (socket as any).roomCode;
    if (!roomCode) return callback && callback({ success: false, error: 'Not in a room' });

    try {
      const room = await store.getRoom(roomCode);
      if (!room) return callback && callback({ success: false, error: 'Room not found' });

      const summaryData = await aiService.generateLectureSummary(
        room.messages || [],
        room.files || [],
        room.qaQuestions || []
      );

      io.to(roomCode).emit('ai:summary-available', summaryData);
      if (typeof callback === 'function') callback({ success: true, summary: summaryData });
    } catch (err: any) {
      console.error('AI summarize error:', err);
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // AI Code Explainer & Fixer
  socket.on('ai:code-help', async (data: { code: string; language: string; mode: 'explain' | 'fix' }, callback) => {
    if (!data.code) return callback && callback({ success: false, error: 'No code provided' });

    try {
      const result = await aiService.explainOrFixCode(data.code, data.language || 'typescript', data.mode || 'explain');
      if (typeof callback === 'function') callback({ success: true, result });
    } catch (err: any) {
      console.error('AI code help error:', err);
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Elevate to faculty
  socket.on('faculty:elevate', async (data: { passphrase: string }, callback) => {
    const roomCode = (socket as any).roomCode;
    if (!roomCode) return callback && callback({ success: false, error: 'Not in a room' });

    if (data.passphrase?.trim() === CONFIG.FACULTY_PASSPHRASE) {
      const member = (socket as any).memberData as Member;
      if (member) {
        member.isFaculty = true;
        (socket as any).memberData = member;
        const room = await store.getRoom(roomCode);
        if (room) {
          const target = room.members.find(m => m.socketId === socket.id);
          if (target) target.isFaculty = true;
          io.to(roomCode).emit('room:updated', room);
        }
      }
      return callback && callback({ success: true });
    } else {
      return callback && callback({ success: false, error: 'Incorrect faculty passphrase' });
    }
  });

  // Toggle chat mute
  socket.on('faculty:toggle-mute', async (data: { muted: boolean }, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;

    if (!roomCode || (!member?.isFaculty && !member?.isCreator)) {
      return callback && callback({ success: false, error: 'Unauthorized' });
    }

    const muted = await store.setChatMuted(roomCode, data.muted);
    io.to(roomCode).emit('room:mute-changed', { muted });

    const updatedRoom = await store.getRoom(roomCode);
    if (updatedRoom) {
      io.to(roomCode).emit('room:updated', updatedRoom);
    }

    if (typeof callback === 'function') callback({ success: true, muted });
  });

  // Pin announcement
  socket.on('faculty:pin-announcement', async (data: { text: string | null }, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;

    if (!roomCode || (!member?.isFaculty && !member?.isCreator)) {
      return callback && callback({ success: false, error: 'Unauthorized' });
    }

    let announcement = null;
    if (data.text && data.text.trim().length > 0) {
      announcement = {
        id: `ann-${Date.now()}`,
        senderId: socket.id,
        senderName: member.displayName,
        isFaculty: true,
        isAnnouncement: true,
        text: data.text.trim(),
        timestamp: Date.now()
      };
    }

    await store.setPinnedAnnouncement(roomCode, announcement);
    io.to(roomCode).emit('room:announcement-pinned', { announcement });

    if (typeof callback === 'function') callback({ success: true, announcement });
  });

  // Kick member
  socket.on('faculty:kick-member', async (data: { targetSocketId: string }, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;

    if (!roomCode || (!member?.isFaculty && !member?.isCreator)) {
      return callback && callback({ success: false, error: 'Unauthorized' });
    }

    const { targetSocketId } = data;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.emit('room:kicked', { reason: 'Removed by faculty' });
      targetSocket.leave(roomCode);
    }

    const { room } = await store.removeMember(roomCode, targetSocketId);
    if (room) {
      io.to(roomCode).emit('room:updated', room);
    }

    if (typeof callback === 'function') callback({ success: true });
  });

  // End room (Only Creator)
  socket.on('room:end', async (_, callback) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;

    if (!roomCode || !member?.isCreator) {
      return callback && callback({ success: false, error: 'Only the room creator can end this room session.' });
    }

    io.to(roomCode).emit('room:ended', { reason: 'The room creator has ended this room session.' });
    await store.deleteRoom(roomCode);

    if (typeof callback === 'function') callback({ success: true });
  });

  // Live Whiteboard Cursor & Author Presence (Low Bandwidth)
  socket.on('whiteboard:cursor-moved', (data: { x: number; y: number; isDrawing?: boolean }) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (roomCode && member) {
      socket.to(roomCode).emit('whiteboard:cursor-received', {
        socketId: socket.id,
        userName: member.displayName,
        isFaculty: !!member.isFaculty,
        x: data.x,
        y: data.y,
        isDrawing: !!data.isDrawing
      });
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    const roomCode = (socket as any).roomCode;
    if (roomCode) {
      const { room } = await store.removeMember(roomCode, socket.id);
      if (room) {
        io.to(roomCode).emit('room:member-left', {
          socketId: socket.id,
          room
        });
      }
    }
  });
}
