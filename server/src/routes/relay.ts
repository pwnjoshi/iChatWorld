import express from 'express';
import { CONFIG } from '../config.js';

const router = express.Router();

interface RelayedFile {
  fileId: string;
  roomCode: string;
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer;
  createdAt: number;
  timer: NodeJS.Timeout;
}

const relayMemory = new Map<string, RelayedFile>();

export function purgeRelayFile(fileId: string) {
  const file = relayMemory.get(fileId);
  if (file) {
    clearTimeout(file.timer);
    relayMemory.delete(fileId);
  }
}

// Upload endpoint (accepts raw body or buffers)
router.post('/upload', express.raw({ type: () => true, limit: '100mb' }), (req, res) => {
  try {
    const fileId = req.headers['x-file-id'] as string;
    const roomCode = req.headers['x-room-code'] as string;
    const rawFilename = req.headers['x-file-name'] as string;
    const filename = rawFilename ? decodeURIComponent(rawFilename) : 'shared-file';
    const mimeType = (req.headers['x-mime-type'] as string) || 'application/octet-stream';

    if (!fileId || !roomCode || !req.body) {
      return res.status(400).json({ error: 'Missing required headers or body' });
    }

    const data = Buffer.isBuffer(req.body) 
      ? req.body 
      : typeof req.body === 'string' 
      ? Buffer.from(req.body) 
      : Buffer.from(JSON.stringify(req.body));

    if (data.length > CONFIG.MAX_RELAY_FILE_SIZE_BYTES) {
      return res.status(413).json({ error: 'File exceeds maximum allowed relay size' });
    }

    // Clear existing if any
    purgeRelayFile(fileId);

    const timer = setTimeout(() => {
      purgeRelayFile(fileId);
    }, CONFIG.RELAY_FILE_PURGE_MS);

    relayMemory.set(fileId, {
      fileId,
      roomCode,
      filename,
      mimeType,
      size: data.length,
      data,
      createdAt: Date.now(),
      timer
    });

    return res.status(200).json({
      success: true,
      fileId,
      downloadUrl: `/api/relay/download/${fileId}`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Download endpoint
router.get('/download/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const file = relayMemory.get(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File expired or not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.data.length);
    return res.send(file.data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
