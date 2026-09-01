import { Server, Socket } from 'socket.io';
import { store } from '../store/index.js';
import { Member, FileMetadata, RTCSignalData } from '../types/index.js';

export function registerSignalingHandlers(io: Server, socket: Socket) {
  // Direct WebRTC signaling packet (offer, answer, ice-candidate)
  socket.on('rtc:signal', (data: RTCSignalData) => {
    const { targetSocketId, type, payload, fileId } = data;
    const member = (socket as any).memberData as Member;

    if (!targetSocketId) return;

    // Route directly to target socket
    io.to(targetSocketId).emit('rtc:signal', {
      senderSocketId: socket.id,
      senderName: member?.displayName || 'Unknown',
      type,
      payload,
      fileId
    });
  });

  // Share file metadata in room
  socket.on('file:announce', async (data: Omit<FileMetadata, 'senderId' | 'senderName' | 'isFaculty' | 'timestamp'> & { isBroadcast?: boolean }, callback) => {
    try {
      const roomCode = (socket as any).roomCode;
      const member = (socket as any).memberData as Member;

      if (!roomCode || !member) {
        return callback && callback({ success: false, error: 'Not in a room' });
      }

      const isBroadcast = !!data.isBroadcast && (member.isFaculty || member.isCreator);

      const fileMeta: FileMetadata = {
        id: data.id || `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: socket.id,
        senderName: member.displayName,
        isFaculty: member.isFaculty,
        isBroadcast,
        filename: data.filename,
        size: data.size,
        mimeType: data.mimeType || 'application/octet-stream',
        timestamp: Date.now(),
        transferMode: data.transferMode || 'p2p',
        downloadUrl: data.downloadUrl
      };

      await store.addFile(roomCode, fileMeta);

      // Broadcast new file to all peers in room
      io.to(roomCode).emit('file:announced', fileMeta);

      if (typeof callback === 'function') {
        callback({ success: true, fileMeta });
      }
    } catch (err: any) {
      if (typeof callback === 'function') {
        callback({ success: false, error: err.message });
      }
    }
  });

  // Delete file from room
  socket.on('file:delete', async (data: { fileId: string }, callback) => {
    try {
      const roomCode = (socket as any).roomCode;
      const member = (socket as any).memberData as Member;

      if (!roomCode || !member || !data.fileId) {
        return callback && callback({ success: false, error: 'Invalid parameters' });
      }

      const room = await store.getRoom(roomCode);
      const targetFile = room?.files.find(f => f.id === data.fileId);
      if (!targetFile) {
        return callback && callback({ success: false, error: 'File not found' });
      }

      const isFacultyOrHost = member.isFaculty || member.isCreator;
      if (targetFile.senderId !== socket.id && !isFacultyOrHost) {
        return callback && callback({ success: false, error: 'Unauthorized to delete this file' });
      }

      const removed = await store.deleteFile(roomCode, data.fileId);
      if (removed) {
        io.to(roomCode).emit('file:deleted', { fileId: data.fileId });
        if (typeof callback === 'function') callback({ success: true, fileId: data.fileId });
      } else {
        if (typeof callback === 'function') callback({ success: false, error: 'Failed to delete file' });
      }
    } catch (err: any) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Peer requests file download from sender
  socket.on('rtc:request-download', (data: { targetSocketId: string; fileId: string }) => {
    const { targetSocketId, fileId } = data;
    const member = (socket as any).memberData as Member;

    io.to(targetSocketId).emit('rtc:download-requested', {
      requesterSocketId: socket.id,
      requesterName: member?.displayName || 'Peer',
      fileId
    });
  });
}
