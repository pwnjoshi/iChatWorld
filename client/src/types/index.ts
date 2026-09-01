export interface Member {
  socketId: string;
  displayName: string;
  isFaculty: boolean;
  isCreator: boolean;
  joinedAt: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: { socketId: string; displayName: string }[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  isFaculty: boolean;
  isSystem?: boolean;
  isAnnouncement?: boolean;
  isAudio?: boolean;
  audioUrl?: string;
  audioDuration?: number;
  isCode?: boolean;
  codeLanguage?: string;
  isDeleted?: boolean;
  deletedBy?: string;
  isEdited?: boolean;
  editedAt?: number;
  text: string;
  timestamp: number;
  reactions?: Record<string, Reaction>;
}

export interface FileMetadata {
  id: string;
  senderId: string;
  senderName: string;
  isFaculty: boolean;
  isBroadcast?: boolean;
  filename: string;
  size: number;
  mimeType: string;
  timestamp: number;
  transferMode: 'p2p' | 'relay';
  downloadUrl?: string;
  blobUrl?: string;
}

export interface HandRaise {
  socketId: string;
  displayName: string;
  raisedAt: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Poll {
  id: string;
  creatorId: string;
  creatorName: string;
  question: string;
  options: PollOption[];
  createdAt: number;
  isOpen: boolean;
  totalVotes: number;
}

export interface WhiteboardPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface WhiteboardStroke {
  id: string;
  type: 'pen' | 'fountain' | 'pencil' | 'brush' | 'ballpoint' | 'marker' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'line' | 'arrow' | 'triangle' | 'diamond' | 'star' | 'image' | 'text';
  color: string;
  size: number;
  opacity?: number;
  points: WhiteboardPoint[];
  isClosed?: boolean;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  text?: string;
  fontSize?: number;
  fontStyle?: string;
}

export interface QAAnswer {
  id: string;
  authorId: string;
  authorName: string;
  isFaculty: boolean;
  text: string;
  timestamp: number;
  upvotes: string[];
}

export interface QAQuestion {
  id: string;
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  text: string;
  timestamp: number;
  upvotes: string[];
  isAnswered: boolean;
  answers: QAAnswer[];
  isEdited?: boolean;
}

export interface ClassroomTimerState {
  durationSec: number;
  remainingSec: number;
  isRunning: boolean;
  startedAt: number | null;
  label: string;
}

export interface PresenterSlide {
  id: string;
  url: string;
  name: string;
}

export interface PresenterState {
  active: boolean;
  presenterId: string;
  presenterName: string;
  currentSlide: number;
  totalSlides: number;
  slideUrl?: string;
  slides?: PresenterSlide[];
  laserPos?: { x: number; y: number } | null;
  annotations?: Record<number, WhiteboardStroke[]>;
}

export interface RoomState {
  code: string;
  createdAt: number;
  expiresAt: number;
  chatMuted: boolean;
  pinnedAnnouncement?: Message | null;
  members: Member[];
  messages: Message[];
  files: FileMetadata[];
  handsRaised: HandRaise[];
  activePoll?: Poll | null;
  whiteboardStrokes: WhiteboardStroke[];
  qaQuestions: QAQuestion[];
  timerState?: ClassroomTimerState | null;
  presenterState?: PresenterState | null;
}

export interface TransferProgress {
  fileId: string;
  filename: string;
  progress: number;
  speed: string;
  status: 'transferring' | 'completed' | 'failed';
  type: 'upload' | 'download';
}

export interface ActiveSessionRoom {
  code: string;
  displayName: string;
  isFaculty: boolean;
  isCreator?: boolean;
  lastVisited?: number;
  lastJoined?: number;
  unreadCount?: number;
}
