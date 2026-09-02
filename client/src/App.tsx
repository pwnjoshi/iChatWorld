import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from './hooks/useSocket.js';
import { useFileTransfer } from './hooks/useFileTransfer.js';
import { HomePage } from './components/home/HomePage.js';
import { RoomView } from './components/room/RoomView.js';
import { Toast } from './components/common/Toast.js';
import { formatRoomCode } from './utils/format.js';
import { ActiveSessionRoom } from './types/index.js';

const SESSION_ROOMS_KEY = 'ichatworld_active_rooms';

export const App: React.FC = () => {
  const {
    room,
    currentMember,
    error,
    typingUsers,
    webrtcManager,
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
    clearError
  } = useSocket();

  const {
    transfers,
    downloadedBlobs,
    uploadFile,
    downloadFile
  } = useFileTransfer(webrtcManager, announceFile);

  const [initialCode, setInitialCode] = useState<string>('');
  
  // Local state for active session history
  const [activeRooms, setActiveRooms] = useState<ActiveSessionRoom[]>(() => {
    try {
      const saved = localStorage.getItem('ichat_active_rooms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Persist active rooms
  useEffect(() => {
    try {
      localStorage.setItem('ichat_active_rooms', JSON.stringify(activeRooms));
    } catch (e) {
      console.error('Failed to persist active rooms', e);
    }
  }, [activeRooms]);

  // Sync current room into activeRooms list
  useEffect(() => {
    if (room && currentMember) {
      setActiveRooms(prev => {
        const entry: ActiveSessionRoom = {
          code: room.code,
          displayName: currentMember.displayName,
          isFaculty: !!currentMember.isFaculty,
          lastJoined: Date.now()
        };
        const filtered = prev.filter(r => r.code !== room.code);
        return [entry, ...filtered];
      });
    }
  }, [room, currentMember]);

  // Detect code from URL query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam) {
      setInitialCode(formatRoomCode(codeParam));
    }
  }, []);

  const handleCreateRoom = async (displayName: string, isFaculty: boolean, passphrase?: string, lifespanHours?: number) => {
    const result = await createRoom(displayName, isFaculty, passphrase, lifespanHours);
    if (result.success && result.code) {
      window.history.replaceState(null, '', `?code=${result.code}`);
    }
  };

  const handleJoinRoom = async (code: string, displayName: string, isFaculty: boolean, passphrase?: string) => {
    const result = await joinRoom(code, displayName, isFaculty, passphrase);
    if (result.success) {
      window.history.replaceState(null, '', `?code=${code}`);
    }
  };

  const handleSwitchRoom = async (targetCode: string) => {
    const target = activeRooms.find(r => r.code === targetCode);
    const displayName = target ? target.displayName : (currentMember?.displayName || 'User');
    const isFaculty = target ? target.isFaculty : false;

    const result = await switchRoom(targetCode, displayName, isFaculty);
    if (result.success) {
      window.history.replaceState(null, '', `?code=${targetCode}`);
    } else {
      handleRemoveRoomFromHistory(targetCode);
    }
  };

  const handleJoinNewRoomFromInside = (code: string) => {
    const displayName = currentMember?.displayName || 'User';
    handleJoinRoom(code, displayName, false);
  };

  const handleCreateNewRoomFromInside = () => {
    const displayName = currentMember?.displayName || 'User';
    handleCreateRoom(displayName, currentMember?.isFaculty || false);
  };

  const handleRemoveRoomFromHistory = (code: string) => {
    setActiveRooms(prev => prev.filter(r => r.code !== code));
  };

  const handleLeaveRoom = () => {
    if (room) {
      handleRemoveRoomFromHistory(room.code);
    }
    setInitialCode('');
    leaveRoom();
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {}
  };

  const handleEndRoom = async () => {
    if (room) {
      handleRemoveRoomFromHistory(room.code);
    }
    setInitialCode('');
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {}
    await endRoom();
    return true;
  };

  const handleUpload = async (file: File, isBroadcast = false) => {
    if (!room) return null;
    return uploadFile(file, room.code, isBroadcast);
  };

  return (
    <div className={`${room ? 'fixed inset-0 w-full h-[100dvh] overflow-hidden' : 'min-h-screen'} ${isDarkMode ? 'dark bg-black text-white' : 'bg-apple-bg text-apple-textPrimary'} font-sans transition-colors duration-200`}>
      <Toast message={error} onClose={clearError} type="error" />

      {!room ? (
        <HomePage
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          initialCode={initialCode}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      ) : (
        <RoomView
          room={room}
          currentMember={currentMember}
          activeRooms={activeRooms}
          typingUsers={typingUsers}
          transfers={transfers}
          downloadedBlobs={downloadedBlobs}
          screenStream={screenStream}
          screenPresenterName={screenPresenterName}
          laserPos={laserPos}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onSwitchRoom={handleSwitchRoom}
          onJoinNewRoom={handleJoinNewRoomFromInside}
          onCreateNewRoom={handleCreateNewRoomFromInside}
          onRemoveRoomFromHistory={handleRemoveRoomFromHistory}
          onSendMessage={sendMessage}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
          onSendAudio={sendAudioMessage}
          onReactToMessage={reactToMessage}
          onSendTyping={sendTyping}
          onEmitWhiteboardStroke={emitWhiteboardStroke}
          onClearWhiteboard={clearWhiteboard}
          onEmitWhiteboardCursor={emitWhiteboardCursor}
          remoteWhiteboardCursors={remoteWhiteboardCursors}
          onUpdateTimerState={updateTimerState}
          onAskQAQuestion={askQAQuestion}
          onEditQAQuestion={editQAQuestion}
          onDeleteQAQuestion={deleteQAQuestion}
          onAnswerQAQuestion={answerQAQuestion}
          onUpvoteQAQuestion={upvoteQAQuestion}
          onUpvoteQAAnswer={upvoteQAAnswer}
          onToggleAnswerQA={toggleAnswerQA}
          onSyncPresenter={syncPresenter}
          onEmitLaserMove={emitLaserMove}
          onAnnotateSlide={annotatePresenterSlide}
          onClearSlideAnnotations={clearPresenterAnnotations}
          onStartScreenShare={startScreenShare}
          onStopScreenShare={stopScreenShare}
          onRaiseHand={raiseHand}
          onLowerHand={lowerHand}
          onLowerAllHands={lowerAllHands}
          onCreatePoll={createPoll}
          onVotePoll={votePoll}
          onClosePoll={closePoll}
          onDeletePoll={deletePoll}
          onUploadFile={handleUpload}
          onDownloadFile={downloadFile}
          onDeleteFile={deleteFile}
          onToggleMute={toggleMute}
          onPinAnnouncement={pinAnnouncement}
          onKickMember={kickMember}
          onElevateFaculty={elevateFaculty}
          onEndRoom={handleEndRoom}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
};

export default App;
