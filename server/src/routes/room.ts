import express from 'express';
import { store } from '../store/index.js';
import { CONFIG } from '../config.js';

const router = express.Router();

// Check if room exists and get public status
router.get('/:code/status', async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const room = await store.getRoom(code);

    if (!room) {
      return res.status(404).json({ exists: false, message: 'Room does not exist or has expired' });
    }

    return res.status(200).json({
      exists: true,
      code: room.code,
      memberCount: room.members.length,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
      chatMuted: room.chatMuted
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Verify faculty passphrase
router.post('/verify-faculty', (req, res) => {
  const { passphrase } = req.body;
  if (!passphrase) {
    return res.status(400).json({ valid: false, error: 'Passphrase required' });
  }

  const isValid = passphrase.trim() === CONFIG.FACULTY_PASSPHRASE;
  return res.status(200).json({ valid: isValid });
});

export default router;
