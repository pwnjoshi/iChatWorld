import { Server, Socket } from 'socket.io';
import { store } from '../store/index.js';
import { Member, Message } from '../types/index.js';
import { aiService } from '../services/aiService.js';

export function registerChatHandlers(io: Server, socket: Socket) {
  // Send chat message
  socket.on('chat:send', async (data: { text: string; isAudio?: boolean; audioUrl?: string; audioDuration?: number; isCode?: boolean; codeLanguage?: string }, callback) => {
    try {
      const roomCode = (socket as any).roomCode;
      const member = (socket as any).memberData as Member;

      if (!roomCode || !member) {
        return callback && callback({ success: false, error: 'Not in a room' });
      }

      const text = (data.text || '').trim();
      if (!text && !data.isAudio) {
        return callback && callback({ success: false, error: 'Empty message' });
      }

      // Check if chat is muted
      const room = await store.getRoom(roomCode);
      if (room?.chatMuted && !member.isFaculty && !member.isCreator) {
        return callback && callback({ success: false, error: 'Chat is muted by faculty' });
      }

      const message: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId: socket.id,
        senderName: member.displayName,
        isFaculty: member.isFaculty,
        isAudio: !!data.isAudio,
        audioUrl: data.audioUrl,
        audioDuration: data.audioDuration,
        isCode: !!data.isCode,
        codeLanguage: data.codeLanguage,
        text: data.isAudio ? '🎤 Voice Message' : text,
        timestamp: Date.now(),
        reactions: {}
      };

      await store.addMessage(roomCode, message);
      io.to(roomCode).emit('chat:received', message);

      if (typeof callback === 'function') callback({ success: true, message });

      // In-Room AI Assistant Trigger (@ai)
      if (text && text.toLowerCase().includes('@ai')) {
        const prompt = text.replace(/@ai/gi, '').trim();
        if (prompt) {
          io.to(roomCode).emit('chat:user-typing', {
            socketId: 'ai-assistant',
            displayName: '✨ iChatWorld AI (Thinking...)',
            isTyping: true
          });

          (async () => {
            try {
              const currentRoom = await store.getRoom(roomCode);
              const aiReply = await aiService.askAssistant(prompt, currentRoom?.messages || []);

              const aiMsg: Message = {
                id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                senderId: 'ai',
                senderName: '✨ iChatWorld AI (DeepSeek)',
                isFaculty: false,
                text: aiReply,
                timestamp: Date.now(),
                reactions: {}
              };

              await store.addMessage(roomCode, aiMsg);
              io.to(roomCode).emit('chat:received', aiMsg);
            } catch (err: any) {
              console.error('AI assistant error:', err);
              const errMsg: Message = {
                id: `ai-err-${Date.now()}`,
                senderId: 'ai',
                senderName: '✨ iChatWorld AI',
                isFaculty: false,
                text: `⚠️ AI Assistant error: ${err.message}`,
                timestamp: Date.now()
              };
              await store.addMessage(roomCode, errMsg);
              io.to(roomCode).emit('chat:received', errMsg);
            } finally {
              io.to(roomCode).emit('chat:user-typing', {
                socketId: 'ai-assistant',
                displayName: '✨ iChatWorld AI',
                isTyping: false
              });
            }
          })();
        }
      }
    } catch (err: any) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Edit sent message
  socket.on('chat:edit', async (data: { messageId: string; text: string }, callback) => {
    try {
      const roomCode = (socket as any).roomCode;
      const member = (socket as any).memberData as Member;

      if (!roomCode || !member || !data.messageId || !data.text?.trim()) {
        return callback && callback({ success: false, error: 'Invalid parameters' });
      }

      const updated = await store.editMessage(roomCode, data.messageId, data.text.trim(), socket.id);
      if (updated) {
        io.to(roomCode).emit('chat:message-updated', updated);
        if (typeof callback === 'function') callback({ success: true, message: updated });
      } else {
        if (typeof callback === 'function') callback({ success: false, error: 'Cannot edit message' });
      }
    } catch (err: any) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Delete message (soft delete)
  socket.on('chat:delete', async (data: { messageId: string }, callback) => {
    try {
      const roomCode = (socket as any).roomCode;
      const member = (socket as any).memberData as Member;

      if (!roomCode || !member || !data.messageId) {
        return callback && callback({ success: false, error: 'Invalid parameters' });
      }

      const isFacultyOrHost = member.isFaculty || member.isCreator;
      const deleted = await store.deleteMessage(roomCode, data.messageId, socket.id, isFacultyOrHost);

      if (deleted) {
        io.to(roomCode).emit('chat:message-updated', deleted);
        if (typeof callback === 'function') callback({ success: true, message: deleted });
      } else {
        if (typeof callback === 'function') callback({ success: false, error: 'Cannot delete message' });
      }
    } catch (err: any) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Tapback reaction on message
  socket.on('chat:react', async (data: { messageId: string; emoji: string }, callback) => {
    try {
      const roomCode = (socket as any).roomCode;
      const member = (socket as any).memberData as Member;

      if (!roomCode || !member || !data.messageId || !data.emoji) {
        return callback && callback({ success: false, error: 'Invalid parameters' });
      }

      const updatedMessage = await store.addReaction(
        roomCode,
        data.messageId,
        data.emoji,
        { socketId: socket.id, displayName: member.displayName }
      );

      if (updatedMessage) {
        io.to(roomCode).emit('chat:message-updated', updatedMessage);
        if (typeof callback === 'function') callback({ success: true, message: updatedMessage });
      } else {
        if (typeof callback === 'function') callback({ success: false, error: 'Message not found' });
      }
    } catch (err: any) {
      if (typeof callback === 'function') callback({ success: false, error: err.message });
    }
  });

  // Typing indicator
  socket.on('chat:typing', (data: { isTyping: boolean }) => {
    const roomCode = (socket as any).roomCode;
    const member = (socket as any).memberData as Member;
    if (roomCode && member) {
      socket.to(roomCode).emit('chat:user-typing', {
        socketId: socket.id,
        displayName: member.displayName,
        isTyping: data.isTyping
      });
    }
  });
}
