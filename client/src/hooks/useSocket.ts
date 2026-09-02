import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  RoomState,
  Member,
  Message,
  FileMetadata,
  HandRaise,
  Poll,
  WhiteboardStroke,
  QAQuestion,
  ClassroomTimerState,
  PresenterState
} from '../types/index.js';
import { WebRTCManager } from '../utils/webrtc.js';
import { playChime, playTimerNotification } from '../utils/sound.js';
import { BACKEND_URL } from '../config.js';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  // Screen share & presenter state
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [screenPresenterName, setScreenPresenterName] = useState<string>('');
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [remoteWhiteboardCursors, setRemoteWhiteboardCursors] = useState<Map<string, { x: number; y: number; userName: string; isFaculty: boolean; isDrawing: boolean; lastUpdated: number }>>(new Map());

  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

  useEffect(() => {
    const socketTarget = BACKEND_URL || window.location.origin;
    const socketInstance = io(socketTarget, {
      transports: ['websocket', 'polling'],  // WebSocket first — avoids stale polling 400s
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // Room update events
    socketInstance.on('room:updated', (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
    });

    socketInstance.on('room:member-joined', (data: { member: Member; room: RoomState }) => {
      setRoom(data.room);
    });

    socketInstance.on('room:member-left', (data: { socketId: string; room: RoomState }) => {
      setRoom(data.room);
    });

    socketInstance.on('room:mute-changed', (data: { muted: boolean }) => {
      setRoom(prev => prev ? { ...prev, chatMuted: data.muted } : null);
    });

    socketInstance.on('room:announcement-pinned', (data: { announcement: Message | null }) => {
      setRoom(prev => prev ? { ...prev, pinnedAnnouncement: data.announcement } : null);
    });

    socketInstance.on('room:hands-updated', (data: { handsRaised: HandRaise[] }) => {
      setRoom(prev => prev ? { ...prev, handsRaised: data.handsRaised } : null);
    });

    socketInstance.on('poll:created', (poll: Poll) => {
      setRoom(prev => prev ? { ...prev, activePoll: poll } : null);
    });

    socketInstance.on('poll:updated', (poll: Poll) => {
      setRoom(prev => prev ? { ...prev, activePoll: poll } : null);
    });

    // Whiteboard events
    socketInstance.on('whiteboard:stroke-received', (stroke: WhiteboardStroke) => {
      setRoom(prev => {
        if (!prev) return null;
        const currentStrokes = prev.whiteboardStrokes || [];
        const existingIndex = currentStrokes.findIndex(s => s.id === stroke.id);
        if (existingIndex !== -1) {
          const updated = [...currentStrokes];
          updated[existingIndex] = stroke;
          return { ...prev, whiteboardStrokes: updated };
        }
        return {
          ...prev,
          whiteboardStrokes: [...currentStrokes, stroke]
        };
      });
    });

    socketInstance.on('whiteboard:cleared', () => {
      setRoom(prev => prev ? { ...prev, whiteboardStrokes: [] } : null);
    });

    socketInstance.on('whiteboard:cursor-received', (data: { socketId: string; userName: string; isFaculty: boolean; x: number; y: number; isDrawing: boolean }) => {
      setRemoteWhiteboardCursors(prev => {
        const next = new Map(prev);
        next.set(data.socketId, {
          x: data.x,
          y: data.y,
          userName: data.userName,
          isFaculty: data.isFaculty,
          isDrawing: data.isDrawing,
          lastUpdated: Date.now()
        });
        return next;
      });
    });

    // Timer events
    socketInstance.on('room:timer-updated', (timerState: ClassroomTimerState | null) => {
      setRoom(prev => prev ? { ...prev, timerState } : null);
    });

    // QA events
    socketInstance.on('qa:question-added', (question: QAQuestion) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          qaQuestions: [question, ...(prev.qaQuestions || [])]
        };
      });
    });

    socketInstance.on('qa:question-updated', (updatedQ: QAQuestion) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          qaQuestions: (prev.qaQuestions || []).map(q => q.id === updatedQ.id ? updatedQ : q)
        };
      });
    });

    socketInstance.on('qa:question-deleted', (data: { questionId: string }) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          qaQuestions: (prev.qaQuestions || []).filter(q => q.id !== data.questionId)
        };
      });
    });

    // Presenter & Laser events
    socketInstance.on('room:presenter-updated', (presenterState: PresenterState | null) => {
      setRoom(prev => prev ? { ...prev, presenterState } : null);
    });

    socketInstance.on('presenter:laser-moved', (pos: { x: number; y: number } | null) => {
      setLaserPos(pos);
    });

    // Screen Share events
    socketInstance.on('screen:stream-started', (data: { presenterSocketId: string; presenterName: string }) => {
      setScreenPresenterName(data.presenterName);
    });

    socketInstance.on('screen:stream-stopped', () => {
      setScreenStream(null);
      setScreenPresenterName('');
    });

    socketInstance.on('room:kicked', (data: { reason: string }) => {
      setError(data.reason || 'You were removed from the room.');
      setRoom(null);
      setCurrentMember(null);
    });

    socketInstance.on('room:ended', (data: { reason: string }) => {
      setError(data.reason || 'This room session has ended.');
      setRoom(null);
      setCurrentMember(null);
    });

    // Chat events
    socketInstance.on('chat:received', (message: Message) => {
      setRoom(prev => {
        if (!prev) return null;
        if (prev.messages.some(m => m.id === message.id)) return prev;
        return {
          ...prev,
          messages: [...prev.messages, message]
        };
      });
    });

    socketInstance.on('chat:message-updated', (updatedMsg: Message) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map(m => m.id === updatedMsg.id ? updatedMsg : m)
        };
      });
    });

    socketInstance.on('chat:user-typing', (data: { socketId: string; displayName: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        if (data.isTyping) {
          next.set(data.socketId, data.displayName);
        } else {
          next.delete(data.socketId);
        }
        return next;
      });
    });

    // File events
    socketInstance.on('file:announced', (fileMeta: FileMetadata) => {
      setRoom(prev => {
        if (!prev) return null;
        if (prev.files.some(f => f.id === fileMeta.id)) return prev;
        return {
          ...prev,
          files: [fileMeta, ...prev.files]
        };
      });
    });

    socketInstance.on('file:deleted', (data: { fileId: string }) => {
      setRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          files: prev.files.filter(f => f.id !== data.fileId)
        };
      });
    });

    // Slide Presenter Annotations
    socketInstance.on('presenter:annotated', (data: { slideIndex: number; stroke: WhiteboardStroke }) => {
      setRoom(prev => {
        if (!prev) return null;
        const currentPres = prev.presenterState || {
          active: true,
          presenterId: '',
          presenterName: '',
          currentSlide: 0,
          totalSlides: 0
        };
        const currentAnnotations = currentPres.annotations || {};
        const slideStrokes = currentAnnotations[data.slideIndex] || [];
        return {
          ...prev,
          presenterState: {
            ...currentPres,
            annotations: {
              ...currentAnnotations,
              [data.slideIndex]: [...slideStrokes, data.stroke]
            }
          }
        };
      });
    });

    socketInstance.on('presenter:annotations-cleared', (data: { slideIndex: number }) => {
      setRoom(prev => {
        if (!prev || !prev.presenterState) return prev;
        const currentAnnotations = { ...(prev.presenterState.annotations || {}) };
        delete currentAnnotations[data.slideIndex];
        return {
          ...prev,
          presenterState: {
            ...prev.presenterState,
            annotations: currentAnnotations
          }
        };
      });
    });

    // Poll Deleted
    socketInstance.on('poll:deleted', () => {
      setRoom(prev => prev ? { ...prev, activePoll: null } : null);
    });

    // Initialize WebRTC Manager
    const rtc = new WebRTCManager(socketInstance);
    rtc.setOnRemoteStream((stream) => {
      setScreenStream(stream);
    });
    webrtcManagerRef.current = rtc;

    setSocket(socketInstance);

    return () => {
      rtc.destroy();
      socketInstance.disconnect();
    };
  }, []);

  const createRoom = useCallback((displayName: string, isFaculty?: boolean, passphrase?: string, lifespanHours?: number): Promise<{ success: boolean; code?: string; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Socket not connected' });

      socket.emit('room:create', { displayName, isFaculty, passphrase, lifespanHours }, (response: any) => {
        if (response?.success) {
          if (response.creatorSecret && response.room?.code) {
            try {
              localStorage.setItem(`ichatworld_creator_${response.room.code}`, response.creatorSecret);
            } catch {}
          }
          setRoom(response.room);
          setCurrentMember(response.member);
          setError(null);
          resolve({ success: true, code: response.room.code });
        } else {
          setError(response?.error || 'Failed to create room');
          resolve({ success: false, error: response?.error });
        }
      });
    });
  }, [socket]);

  const joinRoom = useCallback((code: string, displayName: string, isFaculty?: boolean, passphrase?: string): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Socket not connected' });

      let creatorSecret: string | undefined;
      try {
        creatorSecret = localStorage.getItem(`ichatworld_creator_${code}`) || undefined;
      } catch {}

      socket.emit('room:join', { code, displayName, isFaculty, passphrase, creatorSecret }, (response: any) => {
        if (response?.success) {
          setRoom(response.room);
          setCurrentMember(response.member);
          setError(null);
          resolve({ success: true });
        } else {
          setError(response?.error || 'Failed to join room');
          resolve({ success: false, error: response?.error });
        }
      });
    });
  }, [socket]);

  const switchRoom = useCallback((targetCode: string, displayName: string, isFaculty?: boolean): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socket) return resolve({ success: false, error: 'Socket not connected' });

      let creatorSecret: string | undefined;
      try {
        creatorSecret = localStorage.getItem(`ichatworld_creator_${targetCode}`) || undefined;
      } catch {}

      socket.emit('room:switch', { targetCode, displayName, isFaculty, creatorSecret }, (response: any) => {
        if (response?.success) {
          setRoom(response.room);
          setCurrentMember(response.member);
          setError(null);
          resolve({ success: true });
        } else {
          setError(response?.error || 'Failed to switch room');
          resolve({ success: false, error: response?.error });
        }
      });
    });
  }, [socket]);

  const sendMessage = useCallback((text: string, isCode?: boolean, codeLanguage?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('chat:send', { text, isCode, codeLanguage }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const editMessage = useCallback((messageId: string, text: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('chat:edit', { messageId, text }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const deleteMessage = useCallback((messageId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('chat:delete', { messageId }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const sendAudioMessage = useCallback(async (audioBlob: Blob, duration: number): Promise<boolean> => {
    if (!socket || !room) return false;
    const fileId = `audio-${Date.now()}`;
    try {
      const res = await fetch('/api/relay/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/webm',
          'x-file-id': fileId,
          'x-room-code': room.code,
          'x-file-name': 'voice-note.webm',
          'x-mime-type': 'audio/webm'
        },
        body: audioBlob
      });
      if (res.ok) {
        const data = await res.json();
        return new Promise((resolve) => {
          socket.emit('chat:send', {
            isAudio: true,
            audioUrl: data.downloadUrl,
            audioDuration: Math.round(duration)
          }, (response: any) => {
            resolve(!!response?.success);
          });
        });
      }
    } catch (e) {
      console.error('Failed to upload voice message:', e);
    }
    return false;
  }, [socket, room]);

  const reactToMessage = useCallback((messageId: string, emoji: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('chat:react', { messageId, emoji }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (socket) {
      socket.emit('chat:typing', { isTyping });
    }
  }, [socket]);

  // Whiteboard Actions
  const emitWhiteboardStroke = useCallback((stroke: WhiteboardStroke) => {
    if (socket && room) {
      setRoom(prev => prev ? { ...prev, whiteboardStrokes: [...(prev.whiteboardStrokes || []), stroke] } : null);
      socket.emit('whiteboard:stroke', stroke);
    }
  }, [socket, room]);

  const clearWhiteboard = useCallback(() => {
    if (socket) {
      setRoom(prev => prev ? { ...prev, whiteboardStrokes: [] } : null);
      socket.emit('whiteboard:clear');
    }
  }, [socket]);

  const emitWhiteboardCursor = useCallback((x: number, y: number, isDrawing?: boolean) => {
    if (!socket) return;
    socket.emit('whiteboard:cursor-moved', { x, y, isDrawing });
  }, [socket]);

  // Timer Actions
  const updateTimerState = useCallback((timerState: ClassroomTimerState | null): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('timer:update', timerState, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  // QA Actions
  const askQAQuestion = useCallback((text: string, isAnonymous: boolean): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('qa:ask', { text, isAnonymous }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const editQAQuestion = useCallback((questionId: string, text: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('qa:edit', { questionId, text }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const deleteQAQuestion = useCallback((questionId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('qa:delete', { questionId }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const answerQAQuestion = useCallback((questionId: string, text: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('qa:answer', { questionId, text }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const upvoteQAQuestion = useCallback((questionId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('qa:upvote', { questionId }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const upvoteQAAnswer = useCallback((questionId: string, answerId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('qa:upvote-answer', { questionId, answerId }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const toggleAnswerQA = useCallback((questionId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('qa:toggle-answer', { questionId }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  // Presenter Actions
  const syncPresenter = useCallback((presenterState: PresenterState | null): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('presenter:sync', presenterState, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const emitLaserMove = useCallback((pos: { x: number; y: number } | null) => {
    if (socket) {
      setLaserPos(pos);
      socket.emit('presenter:laser-move', pos);
    }
  }, [socket]);

  // Screen Share Actions
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: true
      });
      setScreenStream(stream);
      setScreenPresenterName(currentMember?.displayName || 'You');

      if (socket && currentMember && room) {
        socket.emit('screen:start', { presenterName: currentMember.displayName });
        const peerSocketIds = (room.members || [])
          .filter(m => m.socketId !== socket.id)
          .map(m => m.socketId);
        if (webrtcManagerRef.current && peerSocketIds.length > 0) {
          webrtcManagerRef.current.broadcastMediaStream(stream, peerSocketIds);
        }
      }

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (e) {
      console.error('Screen sharing cancelled or failed:', e);
    }
  }, [socket, currentMember, room]);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
    }
    setScreenPresenterName('');
    if (socket) {
      if (room && webrtcManagerRef.current) {
        const peerSocketIds = (room.members || [])
          .filter(m => m.socketId !== socket.id)
          .map(m => m.socketId);
        webrtcManagerRef.current.stopBroadcastMediaStream(peerSocketIds);
      }
      socket.emit('screen:stop');
    }
  }, [screenStream, room, socket]);

  const raiseHand = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('hand:raise', {}, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const lowerHand = useCallback((targetSocketId?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('hand:lower', { targetSocketId }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const lowerAllHands = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('hand:lower-all', {}, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const createPoll = useCallback((question: string, options: string[]): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('poll:create', { question, options }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const votePoll = useCallback((pollId: string, optionId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('poll:vote', { pollId, optionId }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const closePoll = useCallback((pollId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('poll:close', { pollId }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const announceFile = useCallback((fileMeta: Omit<FileMetadata, 'senderId' | 'senderName' | 'isFaculty' | 'timestamp'> & { isBroadcast?: boolean }): Promise<FileMetadata | null> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(null);
      socket.emit('file:announce', fileMeta, (response: any) => {
        if (response?.success) {
          resolve(response.fileMeta);
        } else {
          resolve(null);
        }
      });
    });
  }, [socket]);

  const deleteFile = useCallback((fileId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('file:delete', { fileId }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const toggleMute = useCallback((muted: boolean): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('faculty:toggle-mute', { muted }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const pinAnnouncement = useCallback((text: string | null): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('faculty:pin-announcement', { text }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const kickMember = useCallback((targetSocketId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('faculty:kick-member', { targetSocketId }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const deletePoll = useCallback((pollId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('poll:delete', { pollId }, (response: any) => {
        resolve(!!response?.success);
      });
    });
  }, [socket]);

  const getAISummary = useCallback((): Promise<any> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(null);
      socket.emit('ai:summarize', {}, (response: any) => {
        if (response?.success) {
          resolve(response.summary);
        } else {
          resolve(null);
        }
      });
    });
  }, [socket]);

  const getAICodeHelp = useCallback((code: string, language: string, mode: 'explain' | 'fix'): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(null);
      socket.emit('ai:code-help', { code, language, mode }, (response: any) => {
        if (response?.success) {
          resolve(response.result);
        } else {
          resolve(null);
        }
      });
    });
  }, [socket]);

  const annotatePresenterSlide = useCallback((slideIndex: number, stroke: WhiteboardStroke) => {
    if (socket) {
      socket.emit('presenter:annotate', { slideIndex, stroke });
    }
  }, [socket]);

  const clearPresenterAnnotations = useCallback((slideIndex: number) => {
    if (socket) {
      socket.emit('presenter:clear-annotations', { slideIndex });
    }
  }, [socket]);

  const elevateFaculty = useCallback((passphrase: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('faculty:elevate', { passphrase }, (response: any) => {
        if (response?.success) {
          setCurrentMember(prev => prev ? { ...prev, isFaculty: true } : null);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }, [socket]);

  const endRoom = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('room:end', {}, (response: any) => {
        if (response?.success) {
          setRoom(null);
          setCurrentMember(null);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
    setRoom(null);
    setCurrentMember(null);
  }, [socket]);

  return {
    socket,
    room,
    currentMember,
    connected,
    error,
    typingUsers,
    webrtcManager: webrtcManagerRef.current,
    screenStream,
    screenPresenterName,
    laserPos,
    createRoom,
    joinRoom,
    switchRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    sendAudioMessage,
    reactToMessage,
    sendTyping,
    emitWhiteboardStroke,
    clearWhiteboard,
    emitWhiteboardCursor,
    remoteWhiteboardCursors,
    updateTimerState,
    askQAQuestion,
    editQAQuestion,
    deleteQAQuestion,
    answerQAQuestion,
    upvoteQAQuestion,
    upvoteQAAnswer,
    toggleAnswerQA,
    syncPresenter,
    emitLaserMove,
    annotatePresenterSlide,
    clearPresenterAnnotations,
    getAISummary,
    getAICodeHelp,
    startScreenShare,
    stopScreenShare,
    raiseHand,
    lowerHand,
    lowerAllHands,
    createPoll,
    votePoll,
    closePoll,
    deletePoll,
    announceFile,
    deleteFile,
    toggleMute,
    pinAnnouncement,
    kickMember,
    elevateFaculty,
    endRoom,
    leaveRoom,
    clearError: () => setError(null)
  };
}
