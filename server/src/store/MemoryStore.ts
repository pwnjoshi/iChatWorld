import { IStore } from './IStore.js';
import {
  Room,
  Member,
  Message,
  FileMetadata,
  SerializedRoom,
  HandRaise,
  Poll,
  WhiteboardStroke,
  QAQuestion,
  QAAnswer,
  ClassroomTimerState,
  PresenterState
} from '../types/index.js';
import { CONFIG } from '../config.js';

export class MemoryStore implements IStore {
  private rooms: Map<string, Room> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  private serialize(room: Room): SerializedRoom {
    const membersArray: Member[] = room.members instanceof Map 
      ? Array.from(room.members.values())
      : Object.values(room.members);

    return {
      code: room.code,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
      creatorSecret: room.creatorSecret,
      chatMuted: room.chatMuted,
      pinnedAnnouncement: room.pinnedAnnouncement,
      members: membersArray,
      messages: room.messages,
      files: room.files,
      handsRaised: room.handsRaised || [],
      activePoll: room.activePoll || null,
      whiteboardStrokes: room.whiteboardStrokes || [],
      qaQuestions: room.qaQuestions || [],
      timerState: room.timerState || null,
      presenterState: room.presenterState || null
    };
  }

  private resetInactivityTimer(code: string) {
    const existing = this.timers.get(code);
    if (existing) clearTimeout(existing);

    const room = this.rooms.get(code);
    if (room && room.expiresAt === Number.MAX_SAFE_INTEGER) {
      // Unlimited room - kept alive until host closes
      return;
    }

    const timer = setTimeout(() => {
      this.deleteRoom(code);
    }, CONFIG.ROOM_INACTIVITY_TTL_SEC * 1000);

    this.timers.set(code, timer);
  }

  async createRoom(code: string, creator: Member, facultyPassphraseHash?: string, lifespanHours?: number, creatorSecret?: string): Promise<SerializedRoom> {
    const now = Date.now();
    const isUnlimited = lifespanHours === 0;
    const durationHours = (lifespanHours && [1, 3, 6, 12, 24, 48].includes(lifespanHours)) ? lifespanHours : isUnlimited ? 0 : 24;
    const expiresAt = isUnlimited ? Number.MAX_SAFE_INTEGER : now + durationHours * 3600 * 1000;

    const members = new Map<string, Member>();
    members.set(creator.socketId, creator);

    const room: Room = {
      code,
      createdAt: now,
      expiresAt,
      facultyPassphraseHash,
      creatorSecret,
      chatMuted: false,
      pinnedAnnouncement: null,
      members,
      messages: [
        {
          id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          senderId: 'system',
          senderName: 'System',
          isFaculty: false,
          isSystem: true,
          text: `Room ${code} created. Messages and files will be permanently erased when the session ends.`,
          timestamp: now
        }
      ],
      files: [],
      handsRaised: [],
      activePoll: null,
      whiteboardStrokes: [],
      qaQuestions: [],
      timerState: null,
      presenterState: null
    };

    this.rooms.set(code, room);
    this.resetInactivityTimer(code);
    return this.serialize(room);
  }

  async getRoom(code: string): Promise<SerializedRoom | null> {
    const room = this.rooms.get(code);
    if (!room) return null;
    if (Date.now() > room.expiresAt) {
      await this.deleteRoom(code);
      return null;
    }
    return this.serialize(room);
  }

  async touchRoom(code: string): Promise<void> {
    if (this.rooms.has(code)) {
      this.resetInactivityTimer(code);
    }
  }

  async addMember(code: string, member: Member): Promise<SerializedRoom | null> {
    const room = this.rooms.get(code);
    if (!room) return null;

    if (room.members instanceof Map) {
      room.members.set(member.socketId, member);
    } else {
      room.members[member.socketId] = member;
    }

    room.messages.push({
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: 'system',
      senderName: 'System',
      isFaculty: false,
      isSystem: true,
      text: `${member.displayName} joined the room`,
      timestamp: Date.now()
    });

    if (room.messages.length > CONFIG.MAX_MESSAGES_PER_ROOM) {
      room.messages.shift();
    }

    this.touchRoom(code);
    return this.serialize(room);
  }

  async removeMember(code: string, socketId: string): Promise<{ room: SerializedRoom | null; removedMember: Member | null }> {
    const room = this.rooms.get(code);
    if (!room) return { room: null, removedMember: null };

    let removedMember: Member | null = null;
    if (room.members instanceof Map) {
      removedMember = room.members.get(socketId) || null;
      room.members.delete(socketId);
    } else {
      removedMember = room.members[socketId] || null;
      delete room.members[socketId];
    }

    if (room.handsRaised) {
      room.handsRaised = room.handsRaised.filter(h => h.socketId !== socketId);
    }

    if (removedMember) {
      room.messages.push({
        id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: 'system',
        senderName: 'System',
        isFaculty: false,
        isSystem: true,
        text: `${removedMember.displayName} left the room`,
        timestamp: Date.now()
      });

      if (room.messages.length > CONFIG.MAX_MESSAGES_PER_ROOM) {
        room.messages.shift();
      }
    }

    this.touchRoom(code);
    return { room: this.serialize(room), removedMember };
  }

  async addMessage(code: string, message: Message): Promise<Message> {
    const room = this.rooms.get(code);
    if (!room) throw new Error('Room not found');

    room.messages.push(message);
    if (room.messages.length > CONFIG.MAX_MESSAGES_PER_ROOM) {
      room.messages.shift();
    }

    this.touchRoom(code);
    return message;
  }

  async editMessage(code: string, messageId: string, newText: string, editorId: string): Promise<Message | null> {
    const room = this.rooms.get(code);
    if (!room) return null;

    const message = room.messages.find(m => m.id === messageId);
    if (!message || message.isDeleted) return null;

    if (message.senderId !== editorId) return null;

    message.text = newText;
    message.isEdited = true;
    message.editedAt = Date.now();

    this.touchRoom(code);
    return message;
  }

  async deleteMessage(code: string, messageId: string, deleterId: string, isFacultyOrHost: boolean): Promise<Message | null> {
    const room = this.rooms.get(code);
    if (!room) return null;

    const message = room.messages.find(m => m.id === messageId);
    if (!message || message.isDeleted) return null;

    if (message.senderId !== deleterId && !isFacultyOrHost) {
      return null;
    }

    message.isDeleted = true;
    message.deletedBy = message.senderId === deleterId ? 'author' : 'admin';
    message.text = '🚫 This message was deleted';
    message.reactions = {};
    message.isAudio = false;
    message.audioUrl = undefined;

    this.touchRoom(code);
    return message;
  }

  async addReaction(code: string, messageId: string, emoji: string, user: { socketId: string; displayName: string }): Promise<Message | null> {
    const room = this.rooms.get(code);
    if (!room) return null;

    const message = room.messages.find(m => m.id === messageId);
    if (!message || message.isDeleted) return null;

    if (!message.reactions) {
      message.reactions = {};
    }

    const existingReaction = message.reactions[emoji];
    if (existingReaction) {
      const userIndex = existingReaction.users.findIndex(u => u.socketId === user.socketId);
      if (userIndex >= 0) {
        existingReaction.users.splice(userIndex, 1);
        existingReaction.count--;
        if (existingReaction.count <= 0) {
          delete message.reactions[emoji];
        }
      } else {
        existingReaction.users.push(user);
        existingReaction.count++;
      }
    } else {
      message.reactions[emoji] = {
        emoji,
        count: 1,
        users: [user]
      };
    }

    this.touchRoom(code);
    return message;
  }

  async addFile(code: string, file: FileMetadata): Promise<FileMetadata> {
    const room = this.rooms.get(code);
    if (!room) throw new Error('Room not found');

    room.files.push(file);
    this.touchRoom(code);
    return file;
  }

  async deleteFile(code: string, fileId: string): Promise<boolean> {
    const room = this.rooms.get(code);
    if (!room) return false;

    const initialLength = room.files.length;
    room.files = room.files.filter(f => f.id !== fileId);
    this.touchRoom(code);
    return room.files.length < initialLength;
  }

  async setChatMuted(code: string, muted: boolean): Promise<boolean> {
    const room = this.rooms.get(code);
    if (!room) return false;

    room.chatMuted = muted;
    this.touchRoom(code);
    return muted;
  }

  async setPinnedAnnouncement(code: string, announcement: Message | null): Promise<Message | null> {
    const room = this.rooms.get(code);
    if (!room) return null;

    room.pinnedAnnouncement = announcement;
    this.touchRoom(code);
    return announcement;
  }

  async raiseHand(code: string, hand: HandRaise): Promise<HandRaise[]> {
    const room = this.rooms.get(code);
    if (!room) return [];

    if (!room.handsRaised) room.handsRaised = [];
    if (!room.handsRaised.some(h => h.socketId === hand.socketId)) {
      room.handsRaised.push(hand);
    }

    this.touchRoom(code);
    return room.handsRaised;
  }

  async lowerHand(code: string, socketId: string): Promise<HandRaise[]> {
    const room = this.rooms.get(code);
    if (!room || !room.handsRaised) return [];

    room.handsRaised = room.handsRaised.filter(h => h.socketId !== socketId);
    this.touchRoom(code);
    return room.handsRaised;
  }

  async lowerAllHands(code: string): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) return;
    room.handsRaised = [];
    this.touchRoom(code);
  }

  async createPoll(code: string, poll: Poll): Promise<Poll> {
    const room = this.rooms.get(code);
    if (!room) throw new Error('Room not found');

    room.activePoll = poll;
    this.touchRoom(code);
    return poll;
  }

  async votePoll(code: string, pollId: string, optionId: string, socketId: string): Promise<Poll | null> {
    const room = this.rooms.get(code);
    if (!room || !room.activePoll || room.activePoll.id !== pollId || !room.activePoll.isOpen) {
      return null;
    }

    const poll = room.activePoll;
    for (const opt of poll.options) {
      opt.votes = opt.votes.filter(id => id !== socketId);
    }

    const targetOpt = poll.options.find(opt => opt.id === optionId);
    if (targetOpt) {
      targetOpt.votes.push(socketId);
    }

    poll.totalVotes = poll.options.reduce((acc, o) => acc + o.votes.length, 0);
    this.touchRoom(code);
    return poll;
  }

  async closePoll(code: string, pollId: string): Promise<Poll | null> {
    const room = this.rooms.get(code);
    if (!room || !room.activePoll || room.activePoll.id !== pollId) {
      return null;
    }

    room.activePoll.isOpen = false;
    this.touchRoom(code);
    return room.activePoll;
  }

  async deletePoll(code: string, pollId: string): Promise<boolean> {
    const room = this.rooms.get(code);
    if (!room || !room.activePoll || room.activePoll.id !== pollId) {
      return false;
    }

    room.activePoll = null;
    this.touchRoom(code);
    return true;
  }

  async addWhiteboardStroke(code: string, stroke: WhiteboardStroke): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) return;
    if (!room.whiteboardStrokes) room.whiteboardStrokes = [];
    const idx = room.whiteboardStrokes.findIndex(s => s.id === stroke.id);
    if (idx !== -1) {
      room.whiteboardStrokes[idx] = stroke;
    } else {
      room.whiteboardStrokes.push(stroke);
    }
    this.touchRoom(code);
  }

  async clearWhiteboard(code: string): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) return;
    room.whiteboardStrokes = [];
    this.touchRoom(code);
  }

  async addQAQuestion(code: string, question: QAQuestion): Promise<QAQuestion> {
    const room = this.rooms.get(code);
    if (!room) throw new Error('Room not found');
    if (!room.qaQuestions) room.qaQuestions = [];
    if (!question.answers) question.answers = [];
    room.qaQuestions.push(question);
    this.touchRoom(code);
    return question;
  }

  async editQAQuestion(code: string, questionId: string, newText: string, editorId: string): Promise<QAQuestion | null> {
    const room = this.rooms.get(code);
    if (!room || !room.qaQuestions) return null;
    const q = room.qaQuestions.find(item => item.id === questionId);
    if (!q || q.authorId !== editorId) return null;

    q.text = newText;
    q.isEdited = true;
    this.touchRoom(code);
    return q;
  }

  async upvoteQAQuestion(code: string, questionId: string, socketId: string): Promise<QAQuestion | null> {
    const room = this.rooms.get(code);
    if (!room || !room.qaQuestions) return null;
    const q = room.qaQuestions.find(item => item.id === questionId);
    if (!q) return null;

    const idx = q.upvotes.indexOf(socketId);
    if (idx >= 0) {
      q.upvotes.splice(idx, 1);
    } else {
      q.upvotes.push(socketId);
    }

    this.touchRoom(code);
    return q;
  }

  async toggleAnswerQAQuestion(code: string, questionId: string): Promise<QAQuestion | null> {
    const room = this.rooms.get(code);
    if (!room || !room.qaQuestions) return null;
    const q = room.qaQuestions.find(item => item.id === questionId);
    if (!q) return null;

    q.isAnswered = !q.isAnswered;
    this.touchRoom(code);
    return q;
  }

  async addQAAnswer(code: string, questionId: string, answer: QAAnswer): Promise<QAQuestion | null> {
    const room = this.rooms.get(code);
    if (!room || !room.qaQuestions) return null;
    const q = room.qaQuestions.find(item => item.id === questionId);
    if (!q) return null;

    if (!q.answers) q.answers = [];
    q.answers.push(answer);
    q.isAnswered = true; // Automatically marks as answered when an answer is provided

    this.touchRoom(code);
    return q;
  }

  async upvoteQAAnswer(code: string, questionId: string, answerId: string, socketId: string): Promise<QAQuestion | null> {
    const room = this.rooms.get(code);
    if (!room || !room.qaQuestions) return null;
    const q = room.qaQuestions.find(item => item.id === questionId);
    if (!q || !q.answers) return null;

    const a = q.answers.find(ans => ans.id === answerId);
    if (!a) return null;

    const idx = a.upvotes.indexOf(socketId);
    if (idx >= 0) {
      a.upvotes.splice(idx, 1);
    } else {
      a.upvotes.push(socketId);
    }

    this.touchRoom(code);
    return q;
  }

  async setTimerState(code: string, timerState: ClassroomTimerState | null): Promise<ClassroomTimerState | null> {
    const room = this.rooms.get(code);
    if (!room) return null;
    room.timerState = timerState;
    this.touchRoom(code);
    return timerState;
  }

  async setPresenterState(code: string, presenterState: PresenterState | null): Promise<PresenterState | null> {
    const room = this.rooms.get(code);
    if (!room) return null;
    room.presenterState = presenterState;
    this.touchRoom(code);
    return presenterState;
  }

  async deleteRoom(code: string): Promise<boolean> {
    const timer = this.timers.get(code);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(code);
    }
    return this.rooms.delete(code);
  }

  async isRoomActive(code: string): Promise<boolean> {
    return this.rooms.has(code);
  }
}
