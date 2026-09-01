import { useState, useCallback } from 'react';
import { FileMetadata, TransferProgress } from '../types/index.js';
import { WebRTCManager } from '../utils/webrtc.js';
import { getApiUrl } from '../config.js';

export function useFileTransfer(
  webrtcManager: WebRTCManager | null,
  announceFile: (meta: Omit<FileMetadata, 'senderId' | 'senderName' | 'isFaculty' | 'timestamp'> & { isBroadcast?: boolean }) => Promise<FileMetadata | null>
) {
  const [transfers, setTransfers] = useState<Map<string, TransferProgress>>(new Map());
  const [downloadedBlobs, setDownloadedBlobs] = useState<Map<string, string>>(new Map());

  // Upload file (first registers in WebRTC; if fails or requested, can fallback to relay)
  const uploadFile = useCallback(async (file: File, roomCode: string, isBroadcast = false) => {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Register file in WebRTC manager for direct P2P seeding
    if (webrtcManager) {
      webrtcManager.registerLocalFile(fileId, file);
    }

    // Also upload to fallback relay so peers who cannot establish WebRTC (or join later) can still download immediately
    let relayUrl: string | undefined = undefined;
    try {
      const response = await fetch(getApiUrl('/api/relay/upload'), {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-file-id': fileId,
          'x-room-code': roomCode,
          'x-file-name': encodeURIComponent(file.name),
          'x-mime-type': file.type || 'application/octet-stream'
        },
        body: file
      });
      if (response.ok) {
        const data = await response.json();
        relayUrl = data.downloadUrl;
      }
    } catch (e) {
      console.warn('[Relay] Fallback relay upload failed, relying strictly on P2P:', e);
    }

    // Announce file to room
    const fileMeta = await announceFile({
      id: fileId,
      filename: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      transferMode: relayUrl ? 'relay' : 'p2p',
      downloadUrl: relayUrl,
      isBroadcast
    });

    // Create local object URL for instant preview for sender
    const localBlobUrl = URL.createObjectURL(file);
    setDownloadedBlobs(prev => new Map(prev).set(fileId, localBlobUrl));

    return fileMeta;
  }, [webrtcManager, announceFile]);

  // Download file via WebRTC or Relay
  const downloadFile = useCallback(async (file: FileMetadata) => {
    // If already downloaded locally, open or trigger download
    if (downloadedBlobs.has(file.id)) {
      const blobUrl = downloadedBlobs.get(file.id)!;
      triggerBrowserDownload(blobUrl, file.filename);
      return;
    }

    setTransfers(prev => new Map(prev).set(file.id, {
      fileId: file.id,
      filename: file.filename,
      progress: 0,
      speed: 'Connecting...',
      status: 'transferring',
      type: 'download'
    }));

    // Try P2P first if sender is known and webrtcManager is ready
    let p2pSuccess = false;
    if (webrtcManager && file.senderId) {
      try {
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error('P2P Timeout')), 4000);
        });

        const p2pPromise = new Promise<Blob>((resolve, reject) => {
          webrtcManager.initiateTransfer(
            file.senderId,
            file.id,
            (progress) => {
              setTransfers(prev => new Map(prev).set(file.id, {
                fileId: file.id,
                filename: file.filename,
                progress,
                speed: `${progress}%`,
                status: 'transferring',
                type: 'download'
              }));
            },
            (blob) => {
              resolve(blob);
            }
          ).catch(reject);
        });

        const blob = await Promise.race([p2pPromise, timeoutPromise]) as Blob;
        if (blob) {
          p2pSuccess = true;
          const blobUrl = URL.createObjectURL(blob);
          setDownloadedBlobs(prev => new Map(prev).set(file.id, blobUrl));
          setTransfers(prev => new Map(prev).set(file.id, {
            fileId: file.id,
            filename: file.filename,
            progress: 100,
            speed: 'Done',
            status: 'completed',
            type: 'download'
          }));
          triggerBrowserDownload(blobUrl, file.filename);
          return;
        }
      } catch (err) {
        console.log('[FileTransfer] WebRTC P2P fallback to Relay:', err);
      }
    }

    // Fallback to relay download
    if (!p2pSuccess) {
      try {
        setTransfers(prev => new Map(prev).set(file.id, {
          fileId: file.id,
          filename: file.filename,
          progress: 50,
          speed: 'Relay download...',
          status: 'transferring',
          type: 'download'
        }));

        const downloadUrl = file.downloadUrl || `/api/relay/download/${file.id}`;
        const res = await fetch(downloadUrl);
        if (!res.ok) throw new Error('Relay download failed');

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        setDownloadedBlobs(prev => new Map(prev).set(file.id, blobUrl));
        setTransfers(prev => new Map(prev).set(file.id, {
          fileId: file.id,
          filename: file.filename,
          progress: 100,
          speed: 'Done',
          status: 'completed',
          type: 'download'
        }));
        triggerBrowserDownload(blobUrl, file.filename);
      } catch (e: any) {
        setTransfers(prev => new Map(prev).set(file.id, {
          fileId: file.id,
          filename: file.filename,
          progress: 0,
          speed: 'Failed',
          status: 'failed',
          type: 'download'
        }));
      }
    }
  }, [webrtcManager, downloadedBlobs]);

  return {
    transfers,
    downloadedBlobs,
    uploadFile,
    downloadFile
  };
}

function triggerBrowserDownload(blobUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
