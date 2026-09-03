import { Redis } from 'ioredis';
import { IStore } from './IStore.js';
import {
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

export class RedisStore implements IStore {
  private redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });
  }

  async connect() {
    await this.redis.connect();
  }

  private roomKey(code: string): string {
    return `room:${code}`;
  }

  private membersKey(code: string): string {
    return `room:${code}:members`;
  }

  private messagesKey(code: string): string {
    return `room:${code}:messages`;
  }

  private filesKey(code: string): string {
    return `room:${code}:files`;
  }

  private metaKey(code: string): string {
    return `room:${code}:meta`;
  }

  private handsKey(code: string): string {
    return `room:${code}:hands`;
  }

  private pollKey(code: string): string {
    return `room:${code}:poll`;
  }

  private whiteboardKey(code: string): string {
    return `room:${code}:whiteboard`;
  }

  private qaKey(code: string): string {
    return `room:${code}:qa`;
  }

  private timerKey(code: string): string {
    return `room:${code}:timer`;
  }

  private presenterKey(code: string): string {
    return `room:${code}:presenter`;
  }

  async createRoom(code: string, creator: Member, facultyPassphraseHash?: string, lifespanHours?: number): Promise<SerializedRoom> {
    const now = Date.now();
    const isUnlimited = lifespanHours === 0;
    const durationHours = (lifespanHours && [1, 3, 6, 12, 24, 48].includes(lifespanHours)) ? lifespanHours : isUnlimited ? 0 : 24;
    const expiresAt = isUnlimited ? Number.MAX_SAFE_INTEGER : now + durationHours * 3600 * 1000;
    const ttl = isUnlimited ? 30 * 86400 : Math.min(CONFIG.ROOM_INACTIVITY_TTL_SEC, durationHours * 3600);

    const pipeline = this.redis.pipeline();
    pipeline.hset(this.metaKey(code), {
      code,
      createdAt: now.toString(),
      expiresAt: expiresAt.toString(),
      chatMuted: '0',
      facultyPassphraseHash: facultyPassphraseHash || '',
      pinnedAnnouncement: ''
    });
    pipeline.expire(this.metaKey(code), ttl);

    pipeline.hset(this.membersKey(code), creator.socketId, JSON.stringify(creator));
    pipeline.expire(this.membersKey(code), ttl);

    const initialMsg: Message = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: 'system',
      senderName: 'System',
      isFaculty: false,
      isSystem: true,
      text: `Room ${code} created. Messages and files will be permanently erased when the session ends.`,
      timestamp: now
    };

    pipeline.rpush(this.messagesKey(code), JSON.stringify(initialMsg));
    pipeline.expire(this.messagesKey(code), ttl);
    pipeline.del(this.filesKey(code));
    pipeline.expire(this.filesKey(code), ttl);
    pipeline.del(this.handsKey(code));
    pipeline.del(this.pollKey(code));
    pipeline.del(this.whiteboardKey(code));
    pipeline.del(this.qaKey(code));
    pipeline.del(this.timerKey(code));
    pipeline.del(this.presenterKey(code));

    await pipeline.exec();

    return {
      code,
      createdAt: now,
      expiresAt,
      chatMuted: false,
      pinnedAnnouncement: null,
      members: [creator],
      messages: [initialMsg],
      files: [],
      handsRaised: [],
      activePoll: null,
      whiteboardStrokes: [],
      qaQuestions: [],
      timerState: null,
      presenterState: null
    };
  }

  async getRoom(code: string): Promise<SerializedRoom | null> {
    const meta = await this.redis.hgetall(this.metaKey(code));
    if (!meta || !meta.code) return null;

    const [rawMembers, rawMessages, rawFiles, rawHands, rawPoll, rawWhiteboard, rawQA, rawTimer, rawPresenter] = await Promise.all([
      this.redis.hgetall(this.membersKey(code)),
      this.redis.lrange(this.messagesKey(code), 0, -1),
      this.redis.lrange(this.filesKey(code), 0, -1),
      this.redis.lrange(this.handsKey(code), 0, -1),
      this.redis.get(this.pollKey(code)),
      this.redis.lrange(this.whiteboardKey(code), 0, -1),
      this.redis.lrange(this.qaKey(code), 0, -1),
      this.redis.get(this.timerKey(code)),
      this.redis.get(this.presenterKey(code))
    ]);

    const members: Member[] = Object.values(rawMembers).map((str: string) => JSON.parse(str));
    const messages: Message[] = rawMessages.map((str: string) => JSON.parse(str));
    const files: FileMetadata[] = rawFiles.map((str: string) => JSON.parse(str));
    const handsRaised: HandRaise[] = rawHands.map((str: string) => JSON.parse(str));
    const activePoll: Poll | null = rawPoll ? JSON.parse(rawPoll) : null;
    const whiteboardStrokes: WhiteboardStroke[] = rawWhiteboard.map((str: string) => JSON.parse(str));
    const qaQuestions: QAQuestion[] = rawQA.map((str: string) => JSON.parse(str));
    const timerState: ClassroomTimerState | null = rawTimer ? JSON.parse(rawTimer) : null;
    const presenterState: PresenterState | null = rawPresenter ? JSON.parse(rawPresenter) : null;

    let pinnedAnnouncement: Message | null = null;
    if (meta.pinnedAnnouncement) {
      try {
        pinnedAnnouncement = JSON.parse(meta.pinnedAnnouncement);
      } catch {
        pinnedAnnouncement = null;
      }
    }

    return {
      code: meta.code,
      createdAt: parseInt(meta.createdAt || '0', 10),
      expiresAt: parseInt(meta.expiresAt || '0', 10),
      chatMuted: meta.chatMuted === '1',
      pinnedAnnouncement,
      members,
      messages,
      files,
      handsRaised,
      activePoll,
      whiteboardStrokes,
      qaQuestions,
      timerState,
      presenterState
    };
  }

  async touchRoom(code: string): Promise<void> {
    const ttl = CONFIG.ROOM_INACTIVITY_TTL_SEC;
    const pipeline = this.redis.pipeline();
    pipeline.expire(this.metaKey(code), ttl);
    pipeline.expire(this.membersKey(code), ttl);
    pipeline.expire(this.messagesKey(code), ttl);
    pipeline.expire(this.filesKey(code), ttl);
    pipeline.expire(this.handsKey(code), ttl);
    pipeline.expire(this.pollKey(code), ttl);
    pipeline.expire(this.whiteboardKey(code), ttl);
    pipeline.expire(this.qaKey(code), ttl);
    pipeline.expire(this.timerKey(code), ttl);
    pipeline.expire(this.presenterKey(code), ttl);
    await pipeline.exec();
  }

  async addMember(code: string, member: Member): Promise<SerializedRoom | null> {
    const exists = await this.redis.exists(this.metaKey(code));
    if (!exists) return null;

    const sysMsg: Message = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: 'system',
      senderName: 'System',
      isFaculty: false,
      isSystem: true,
      text: `${member.displayName} joined the room`,
      timestamp: Date.now()
    };

    const pipeline = this.redis.pipeline();
    pipeline.hset(this.membersKey(code), member.socketId, JSON.stringify(member));
    pipeline.rpush(this.messagesKey(code), JSON.stringify(sysMsg));
    pipeline.ltrim(this.messagesKey(code), -CONFIG.MAX_MESSAGES_PER_ROOM, -1);
    await pipeline.exec();

    await this.touchRoom(code);
    return this.getRoom(code);
  }

  async removeMember(code: string, socketId: string): Promise<{ room: SerializedRoom | null; removedMember: Member | null }> {
    const rawMember = await this.redis.hget(this.membersKey(code), socketId);
    let removedMember: Member | null = null;
    if (rawMember) {
      removedMember = JSON.parse(rawMember);
      const sysMsg: Message = {
        id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: 'system',
        senderName: 'System',
        isFaculty: false,
        isSystem: true,
        text: `${removedMember?.displayName} left the room`,
        timestamp: Date.now()
      };

      const pipeline = this.redis.pipeline();
      pipeline.hdel(this.membersKey(code), socketId);
      pipeline.rpush(this.messagesKey(code), JSON.stringify(sysMsg));
      pipeline.ltrim(this.messagesKey(code), -CONFIG.MAX_MESSAGES_PER_ROOM, -1);
      await pipeline.exec();
    }

    await this.lowerHand(code, socketId);
    await this.touchRoom(code);
    const room = await this.getRoom(code);
    return { room, removedMember };
  }

  async addMessage(code: string, message: Message): Promise<Message> {
    const pipeline = this.redis.pipeline();
    pipeline.rpush(this.messagesKey(code), JSON.stringify(message));
    pipeline.ltrim(this.messagesKey(code), -CONFIG.MAX_MESSAGES_PER_ROOM, -1);
    await pipeline.exec();

    await this.touchRoom(code);
    return message;
  }

  async editMessage(code: string, messageId: string, newText: string, editorId: string): Promise<Message | null> {
    const rawMessages = await this.redis.lrange(this.messagesKey(code), 0, -1);
    let targetMessage: Message | null = null;
    let targetIndex = -1;

    for (let i = 0; i < rawMessages.length; i++) {
      const msg: Message = JSON.parse(rawMessages[i]);
      if (msg.id === messageId) {
        targetMessage = msg;
        targetIndex = i;
        break;
      }
    }

    if (!targetMessage || targetIndex < 0 || targetMessage.isDeleted) return null;
    if (targetMessage.senderId !== editorId) return null;

    targetMessage.text = newText;
    targetMessage.isEdited = true;
    targetMessage.editedAt = Date.now();

    await this.redis.lset(this.messagesKey(code), targetIndex, JSON.stringify(targetMessage));
    await this.touchRoom(code);
    return targetMessage;
  }

  async deleteMessage(code: string, messageId: string, deleterId: string, isFacultyOrHost: boolean): Promise<Message | null> {
    const rawMessages = await this.redis.lrange(this.messagesKey(code), 0, -1);
    let targetMessage: Message | null = null;
    let targetIndex = -1;

    for (let i = 0; i < rawMessages.length; i++) {
      const msg: Message = JSON.parse(rawMessages[i]);
      if (msg.id === messageId) {
        targetMessage = msg;
        targetIndex = i;
        break;
      }
    }

    if (!targetMessage || targetIndex < 0 || targetMessage.isDeleted) return null;
    if (targetMessage.senderId !== deleterId && !isFacultyOrHost) return null;

    targetMessage.isDeleted = true;
    targetMessage.deletedBy = targetMessage.senderId === deleterId ? 'author' : 'admin';
    targetMessage.text = '🚫 This message was deleted';
    targetMessage.reactions = {};
    targetMessage.isAudio = false;
    targetMessage.audioUrl = undefined;

    await this.redis.lset(this.messagesKey(code), targetIndex, JSON.stringify(targetMessage));
    await this.touchRoom(code);
    return targetMessage;
  }

  async addReaction(code: string, messageId: string, emoji: string, user: { socketId: string; displayName: string }): Promise<Message | null> {
    const rawMessages = await this.redis.lrange(this.messagesKey(code), 0, -1);
    let targetMessage: Message | null = null;
    let targetIndex = -1;

    for (let i = 0; i < rawMessages.length; i++) {
      const msg: Message = JSON.parse(rawMessages[i]);
      if (msg.id === messageId) {
        targetMessage = msg;
        targetIndex = i;
        break;
      }
    }

    if (!targetMessage || targetIndex < 0 || targetMessage.isDeleted) return null;

    if (!targetMessage.reactions) {
      targetMessage.reactions = {};
    }

    const existingReaction = targetMessage.reactions[emoji];
    if (existingReaction) {
      const userIndex = existingReaction.users.findIndex(u => u.socketId === user.socketId);
      if (userIndex >= 0) {
        existingReaction.users.splice(userIndex, 1);
        existingReaction.count--;
        if (existingReaction.count <= 0) {
          delete targetMessage.reactions[emoji];
        }
      } else {
        existingReaction.users.push(user);
        existingReaction.count++;
      }
    } else {
      targetMessage.reactions[emoji] = {
        emoji,
        count: 1,
        users: [user]
      };
    }

    await this.redis.lset(this.messagesKey(code), targetIndex, JSON.stringify(targetMessage));
    await this.touchRoom(code);
    return targetMessage;
  }

  async addFile(code: string, file: FileMetadata): Promise<FileMetadata> {
    await this.redis.rpush(this.filesKey(code), JSON.stringify(file));
    await this.touchRoom(code);
    return file;
  }

  async deleteFile(code: string, fileId: string): Promise<boolean> {
    const rawFiles = await this.redis.lrange(this.filesKey(code), 0, -1);
    const files: FileMetadata[] = rawFiles.map(str => JSON.parse(str));
    const filtered = files.filter(f => f.id !== fileId);

    await this.redis.del(this.filesKey(code));
    if (filtered.length > 0) {
      const pipeline = this.redis.pipeline();
      for (const f of filtered) {
        pipeline.rpush(this.filesKey(code), JSON.stringify(f));
      }
      await pipeline.exec();
    }
    await this.touchRoom(code);
    return filtered.length < files.length;
  }

  async setChatMuted(code: string, muted: boolean): Promise<boolean> {
    await this.redis.hset(this.metaKey(code), 'chatMuted', muted ? '1' : '0');
    await this.touchRoom(code);
    return muted;
  }

  async setPinnedAnnouncement(code: string, announcement: Message | null): Promise<Message | null> {
    await this.redis.hset(
      this.metaKey(code),
      'pinnedAnnouncement',
      announcement ? JSON.stringify(announcement) : ''
    );
    await this.touchRoom(code);
    return announcement;
  }

  async raiseHand(code: string, hand: HandRaise): Promise<HandRaise[]> {
    const rawHands = await this.redis.lrange(this.handsKey(code), 0, -1);
    const hands: HandRaise[] = rawHands.map(str => JSON.parse(str));
    if (!hands.some(h => h.socketId === hand.socketId)) {
      hands.push(hand);
      await this.redis.rpush(this.handsKey(code), JSON.stringify(hand));
    }
    await this.touchRoom(code);
    return hands;
  }

  async lowerHand(code: string, socketId: string): Promise<HandRaise[]> {
    const rawHands = await this.redis.lrange(this.handsKey(code), 0, -1);
    const hands: HandRaise[] = rawHands.map(str => JSON.parse(str));
    const filtered = hands.filter(h => h.socketId !== socketId);
    await this.redis.del(this.handsKey(code));
    if (filtered.length > 0) {
      const pipeline = this.redis.pipeline();
      for (const h of filtered) {
        pipeline.rpush(this.handsKey(code), JSON.stringify(h));
      }
      await pipeline.exec();
    }
    await this.touchRoom(code);
    return filtered;
  }

  async lowerAllHands(code: string): Promise<void> {
    await this.redis.del(this.handsKey(code));
    await this.touchRoom(code);
  }

  async createPoll(code: string, poll: Poll): Promise<Poll> {
    await this.redis.set(this.pollKey(code), JSON.stringify(poll));
    await this.touchRoom(code);
    return poll;
  }

  async votePoll(code: string, pollId: string, optionId: string, socketId: string): Promise<Poll | null> {
    const raw = await this.redis.get(this.pollKey(code));
    if (!raw) return null;
    const poll: Poll = JSON.parse(raw);
    if (poll.id !== pollId || !poll.isOpen) return null;

    for (const opt of poll.options) {
      opt.votes = opt.votes.filter(id => id !== socketId);
    }
    const targetOpt = poll.options.find(opt => opt.id === optionId);
    if (targetOpt) {
      targetOpt.votes.push(socketId);
    }
    poll.totalVotes = poll.options.reduce((acc, o) => acc + o.votes.length, 0);
    await this.redis.set(this.pollKey(code), JSON.stringify(poll));
    await this.touchRoom(code);
    return poll;
  }

  async closePoll(code: string, pollId: string): Promise<Poll | null> {
    const raw = await this.redis.get(this.pollKey(code));
    if (!raw) return null;
    const poll: Poll = JSON.parse(raw);
    if (poll.id !== pollId) return null;

    poll.isOpen = false;
    await this.redis.set(this.pollKey(code), JSON.stringify(poll));
    await this.touchRoom(code);
    return poll;
  }

  async deletePoll(code: string, pollId: string): Promise<boolean> {
    const raw = await this.redis.get(this.pollKey(code));
    if (!raw) return false;
    const poll: Poll = JSON.parse(raw);
    if (poll.id !== pollId) return false;

    await this.redis.del(this.pollKey(code));
    await this.touchRoom(code);
    return true;
  }

  async addWhiteboardStroke(code: string, stroke: WhiteboardStroke): Promise<void> {
    const raw = await this.redis.lrange(this.whiteboardKey(code), 0, -1);
    let foundIdx = -1;
    for (let i = 0; i < raw.length; i++) {
      try {
        const s: WhiteboardStroke = JSON.parse(raw[i]);
        if (s.id === stroke.id) {
          foundIdx = i;
          break;
        }
      } catch {}
    }
    if (foundIdx !== -1) {
      await this.redis.lset(this.whiteboardKey(code), foundIdx, JSON.stringify(stroke));
    } else {
      await this.redis.rpush(this.whiteboardKey(code), JSON.stringify(stroke));
    }
    await this.touchRoom(code);
  }

  async clearWhiteboard(code: string): Promise<void> {
    await this.redis.del(this.whiteboardKey(code));
    await this.touchRoom(code);
  }

  async addQAQuestion(code: string, question: QAQuestion): Promise<QAQuestion> {
    if (!question.answers) question.answers = [];
    await this.redis.rpush(this.qaKey(code), JSON.stringify(question));
    await this.touchRoom(code);
    return question;
  }

  async editQAQuestion(code: string, questionId: string, newText: string, editorId: string): Promise<QAQuestion | null> {
    const raw = await this.redis.lrange(this.qaKey(code), 0, -1);
    let targetQ: QAQuestion | null = null;
    let targetIdx = -1;

    for (let i = 0; i < raw.length; i++) {
      const q: QAQuestion = JSON.parse(raw[i]);
      if (q.id === questionId) {
        targetQ = q;
        targetIdx = i;
        break;
      }
    }

    if (!targetQ || targetIdx < 0 || targetQ.authorId !== editorId) return null;

    targetQ.text = newText;
    targetQ.isEdited = true;
    await this.redis.lset(this.qaKey(code), targetIdx, JSON.stringify(targetQ));
    await this.touchRoom(code);
    return targetQ;
  }

  async deleteQAQuestion(code: string, questionId: string, authorSocketId: string, isFacultyOrHost: boolean): Promise<boolean> {
    const raw = await this.redis.lrange(this.qaKey(code), 0, -1);
    let targetIdx = -1;

    for (let i = 0; i < raw.length; i++) {
      const q: QAQuestion = JSON.parse(raw[i]);
      if (q.id === questionId) {
        if (q.authorId === authorSocketId || isFacultyOrHost) {
          targetIdx = i;
        }
        break;
      }
    }

    if (targetIdx < 0) return false;

    // Use a sentinel to remove
    const sentinel = `__DELETE__${Date.now()}`;
    await this.redis.lset(this.qaKey(code), targetIdx, sentinel);
    await this.redis.lrem(this.qaKey(code), 1, sentinel);
    await this.touchRoom(code);
    return true;
  }

  async upvoteQAQuestion(code: string, questionId: string, socketId: string): Promise<QAQuestion | null> {
    const raw = await this.redis.lrange(this.qaKey(code), 0, -1);
    let targetQ: QAQuestion | null = null;
    let targetIdx = -1;

    for (let i = 0; i < raw.length; i++) {
      const q: QAQuestion = JSON.parse(raw[i]);
      if (q.id === questionId) {
        targetQ = q;
        targetIdx = i;
        break;
      }
    }

    if (!targetQ || targetIdx < 0) return null;

    const idx = targetQ.upvotes.indexOf(socketId);
    if (idx >= 0) {
      targetQ.upvotes.splice(idx, 1);
    } else {
      targetQ.upvotes.push(socketId);
    }

    await this.redis.lset(this.qaKey(code), targetIdx, JSON.stringify(targetQ));
    await this.touchRoom(code);
    return targetQ;
  }

  async toggleAnswerQAQuestion(code: string, questionId: string): Promise<QAQuestion | null> {
    const raw = await this.redis.lrange(this.qaKey(code), 0, -1);
    let targetQ: QAQuestion | null = null;
    let targetIdx = -1;

    for (let i = 0; i < raw.length; i++) {
      const q: QAQuestion = JSON.parse(raw[i]);
      if (q.id === questionId) {
        targetQ = q;
        targetIdx = i;
        break;
      }
    }

    if (!targetQ || targetIdx < 0) return null;

    targetQ.isAnswered = !targetQ.isAnswered;
    await this.redis.lset(this.qaKey(code), targetIdx, JSON.stringify(targetQ));
    await this.touchRoom(code);
    return targetQ;
  }

  async addQAAnswer(code: string, questionId: string, answer: QAAnswer): Promise<QAQuestion | null> {
    const raw = await this.redis.lrange(this.qaKey(code), 0, -1);
    let targetQ: QAQuestion | null = null;
    let targetIdx = -1;

    for (let i = 0; i < raw.length; i++) {
      const q: QAQuestion = JSON.parse(raw[i]);
      if (q.id === questionId) {
        targetQ = q;
        targetIdx = i;
        break;
      }
    }

    if (!targetQ || targetIdx < 0) return null;

    if (!targetQ.answers) targetQ.answers = [];
    targetQ.answers.push(answer);
    targetQ.isAnswered = true;

    await this.redis.lset(this.qaKey(code), targetIdx, JSON.stringify(targetQ));
    await this.touchRoom(code);
    return targetQ;
  }

  async upvoteQAAnswer(code: string, questionId: string, answerId: string, socketId: string): Promise<QAQuestion | null> {
    const raw = await this.redis.lrange(this.qaKey(code), 0, -1);
    let targetQ: QAQuestion | null = null;
    let targetIdx = -1;

    for (let i = 0; i < raw.length; i++) {
      const q: QAQuestion = JSON.parse(raw[i]);
      if (q.id === questionId) {
        targetQ = q;
        targetIdx = i;
        break;
      }
    }

    if (!targetQ || targetIdx < 0 || !targetQ.answers) return null;

    const a = targetQ.answers.find(ans => ans.id === answerId);
    if (!a) return null;

    const idx = a.upvotes.indexOf(socketId);
    if (idx >= 0) {
      a.upvotes.splice(idx, 1);
    } else {
      a.upvotes.push(socketId);
    }

    await this.redis.lset(this.qaKey(code), targetIdx, JSON.stringify(targetQ));
    await this.touchRoom(code);
    return targetQ;
  }

  async setTimerState(code: string, timerState: ClassroomTimerState | null): Promise<ClassroomTimerState | null> {
    if (timerState) {
      await this.redis.set(this.timerKey(code), JSON.stringify(timerState));
    } else {
      await this.redis.del(this.timerKey(code));
    }
    await this.touchRoom(code);
    return timerState;
  }

  async setPresenterState(code: string, presenterState: PresenterState | null): Promise<PresenterState | null> {
    if (presenterState) {
      await this.redis.set(this.presenterKey(code), JSON.stringify(presenterState));
    } else {
      await this.redis.del(this.presenterKey(code));
    }
    await this.touchRoom(code);
    return presenterState;
  }

  async deleteRoom(code: string): Promise<boolean> {
    const result = await this.redis.del(
      this.metaKey(code),
      this.membersKey(code),
      this.messagesKey(code),
      this.filesKey(code),
      this.handsKey(code),
      this.pollKey(code),
      this.whiteboardKey(code),
      this.qaKey(code),
      this.timerKey(code),
      this.presenterKey(code)
    );
    return result > 0;
  }

  async isRoomActive(code: string): Promise<boolean> {
    return (await this.redis.exists(this.metaKey(code))) === 1;
  }
}
