import { Socket } from 'socket.io-client';

const CHUNK_SIZE = 64 * 1024; // 64KB chunks
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export interface FileChunkHeader {
  type: 'header';
  fileId: string;
  filename: string;
  mimeType: string;
  totalSize: number;
  totalChunks: number;
}

export interface FileChunkPayload {
  type: 'chunk';
  fileId: string;
  chunkIndex: number;
}

export class WebRTCManager {
  private socket: Socket;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private pendingDownloads: Map<string, {
    header?: FileChunkHeader;
    receivedChunks: ArrayBuffer[];
    receivedBytes: number;
    onProgress?: (progress: number) => void;
    onComplete?: (blob: Blob) => void;
  }> = new Map();
  private localFiles: Map<string, File> = new Map();

  constructor(socket: Socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  public registerLocalFile(fileId: string, file: File) {
    this.localFiles.set(fileId, file);
  }

  private setupSocketListeners() {
    this.socket.on('rtc:signal', async (data: { senderSocketId: string; type: string; payload: any; fileId?: string }) => {
      const { senderSocketId, type, payload, fileId } = data;

      if (type === 'offer') {
        await this.handleOffer(senderSocketId, payload);
      } else if (type === 'answer') {
        await this.handleAnswer(senderSocketId, payload);
      } else if (type === 'ice-candidate') {
        await this.handleCandidate(senderSocketId, payload);
      }
    });

    this.socket.on('rtc:download-requested', async (data: { requesterSocketId: string; fileId: string }) => {
      const file = this.localFiles.get(data.fileId);
      if (file) {
        this.sendFileToPeer(data.requesterSocketId, data.fileId, file);
      }
    });
  }

  private getOrCreatePeerConnection(targetSocketId: string): RTCPeerConnection {
    let pc = this.peerConnections.get(targetSocketId);
    if (!pc || pc.connectionState === 'closed' || pc.connectionState === 'failed') {
      pc = new RTCPeerConnection(RTC_CONFIG);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('rtc:signal', {
            targetSocketId,
            type: 'ice-candidate',
            payload: event.candidate
          });
        }
      };

      pc.ondatachannel = (event) => {
        this.setupDataChannel(targetSocketId, event.channel);
      };

      this.peerConnections.set(targetSocketId, pc);
    }
    return pc;
  }

  private setupDataChannel(targetSocketId: string, channel: RTCDataChannel) {
    channel.binaryType = 'arraybuffer';
    this.dataChannels.set(targetSocketId, channel);

    let currentFileId: string | null = null;

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'header') {
            currentFileId = msg.fileId;
            const existing = this.pendingDownloads.get(msg.fileId) || { receivedChunks: [], receivedBytes: 0 };
            this.pendingDownloads.set(msg.fileId, {
              ...existing,
              header: msg,
              receivedChunks: [],
              receivedBytes: 0
            });
          }
        } catch (e) {
          console.error('[WebRTC] Error parsing JSON channel message:', e);
        }
      } else if (event.data instanceof ArrayBuffer && currentFileId) {
        const download = this.pendingDownloads.get(currentFileId);
        if (download && download.header) {
          download.receivedChunks.push(event.data);
          download.receivedBytes += event.data.byteLength;

          const progress = Math.min(100, Math.round((download.receivedBytes / download.header.totalSize) * 100));
          if (download.onProgress) {
            download.onProgress(progress);
          }

          if (download.receivedBytes >= download.header.totalSize || download.receivedChunks.length >= download.header.totalChunks) {
            const blob = new Blob(download.receivedChunks, { type: download.header.mimeType });
            if (download.onComplete) {
              download.onComplete(blob);
            }
          }
        }
      }
    };
  }

  public async initiateTransfer(targetSocketId: string, fileId: string, onProgress?: (p: number) => void, onComplete?: (blob: Blob) => void): Promise<void> {
    this.pendingDownloads.set(fileId, {
      receivedChunks: [],
      receivedBytes: 0,
      onProgress,
      onComplete
    });

    const pc = this.getOrCreatePeerConnection(targetSocketId);
    let channel = this.dataChannels.get(targetSocketId);

    if (!channel || channel.readyState !== 'open') {
      channel = pc.createDataChannel('fileTransfer', { ordered: true });
      this.setupDataChannel(targetSocketId, channel);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.socket.emit('rtc:signal', {
        targetSocketId,
        type: 'offer',
        payload: offer,
        fileId
      });
    } else {
      // Data channel is already open, request file directly
      this.socket.emit('rtc:request-download', { targetSocketId, fileId });
    }
  }

  public async sendFileToPeer(targetSocketId: string, fileId: string, file: File, onProgress?: (p: number) => void) {
    const pc = this.getOrCreatePeerConnection(targetSocketId);
    let channel = this.dataChannels.get(targetSocketId);

    const send = async (dc: RTCDataChannel) => {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const header: FileChunkHeader = {
        type: 'header',
        fileId,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        totalSize: file.size,
        totalChunks
      };

      dc.send(JSON.stringify(header));

      let offset = 0;
      let chunkIndex = 0;

      while (offset < file.size) {
        // Handle bufferedAmount backpressure
        if (dc.bufferedAmount > 8 * 1024 * 1024) {
          await new Promise(res => setTimeout(res, 50));
        }

        const slice = file.slice(offset, offset + CHUNK_SIZE);
        const buffer = await slice.arrayBuffer();
        dc.send(buffer);

        offset += buffer.byteLength;
        chunkIndex++;

        const progress = Math.min(100, Math.round((offset / file.size) * 100));
        if (onProgress) onProgress(progress);
      }
    };

    if (channel && channel.readyState === 'open') {
      await send(channel);
    } else {
      channel = pc.createDataChannel('fileTransfer', { ordered: true });
      this.setupDataChannel(targetSocketId, channel);

      channel.onopen = async () => {
        await send(channel!);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.socket.emit('rtc:signal', {
        targetSocketId,
        type: 'offer',
        payload: offer,
        fileId
      });
    }
  }

  private async handleOffer(senderSocketId: string, offer: RTCSessionDescriptionInit) {
    const pc = this.getOrCreatePeerConnection(senderSocketId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.socket.emit('rtc:signal', {
      targetSocketId: senderSocketId,
      type: 'answer',
      payload: answer
    });
  }

  private async handleAnswer(senderSocketId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(senderSocketId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  private async handleCandidate(senderSocketId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(senderSocketId);
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('[WebRTC] Error adding ICE candidate:', e);
      }
    }
  }

  public destroy() {
    this.dataChannels.forEach(dc => dc.close());
    this.peerConnections.forEach(pc => pc.close());
    this.dataChannels.clear();
    this.peerConnections.clear();
    this.localFiles.clear();
  }
}
