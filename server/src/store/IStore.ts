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

export interface IStore {
  createRoom(code: string, creator: Member, facultyPassphraseHash?: string, lifespanHours?: number): Promise<SerializedRoom>;
  getRoom(code: string): Promise<SerializedRoom | null>;
  touchRoom(code: string): Promise<void>;
  addMember(code: string, member: Member): Promise<SerializedRoom | null>;
  removeMember(code: string, socketId: string): Promise<{ room: SerializedRoom | null; removedMember: Member | null }>;
  addMessage(code: string, message: Message): Promise<Message>;
  editMessage(code: string, messageId: string, newText: string, editorId: string): Promise<Message | null>;
  deleteMessage(code: string, messageId: string, deleterId: string, isFacultyOrHost: boolean): Promise<Message | null>;
  addReaction(code: string, messageId: string, emoji: string, user: { socketId: string; displayName: string }): Promise<Message | null>;
  addFile(code: string, file: FileMetadata): Promise<FileMetadata>;
  deleteFile(code: string, fileId: string): Promise<boolean>;
  setChatMuted(code: string, muted: boolean): Promise<boolean>;
  setPinnedAnnouncement(code: string, announcement: Message | null): Promise<Message | null>;
  raiseHand(code: string, hand: HandRaise): Promise<HandRaise[]>;
  lowerHand(code: string, socketId: string): Promise<HandRaise[]>;
  lowerAllHands(code: string): Promise<void>;
  createPoll(code: string, poll: Poll): Promise<Poll>;
  votePoll(code: string, pollId: string, optionId: string, socketId: string): Promise<Poll | null>;
  closePoll(code: string, pollId: string): Promise<Poll | null>;
  deletePoll(code: string, pollId: string): Promise<boolean>;
  addWhiteboardStroke(code: string, stroke: WhiteboardStroke): Promise<void>;
  clearWhiteboard(code: string): Promise<void>;
  addQAQuestion(code: string, question: QAQuestion): Promise<QAQuestion>;
  editQAQuestion(code: string, questionId: string, newText: string, editorId: string): Promise<QAQuestion | null>;
  upvoteQAQuestion(code: string, questionId: string, socketId: string): Promise<QAQuestion | null>;
  toggleAnswerQAQuestion(code: string, questionId: string): Promise<QAQuestion | null>;
  addQAAnswer(code: string, questionId: string, answer: QAAnswer): Promise<QAQuestion | null>;
  upvoteQAAnswer(code: string, questionId: string, answerId: string, socketId: string): Promise<QAQuestion | null>;
  setTimerState(code: string, timerState: ClassroomTimerState | null): Promise<ClassroomTimerState | null>;
  setPresenterState(code: string, presenterState: PresenterState | null): Promise<PresenterState | null>;
  deleteRoom(code: string): Promise<boolean>;
  isRoomActive(code: string): Promise<boolean>;
}
