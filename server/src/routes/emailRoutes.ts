import { Router, Request, Response } from 'express';
import { emailOtpStore } from '../utils/emailOtpStore.js';
import { emailService } from '../services/emailService.js';

export const emailRouter = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/email/send-otp
 * Body: { email: string }
 */
emailRouter.post('/send-otp', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const rateCheck = emailOtpStore.canRequestOtp(cleanEmail);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Too many requests. Please wait ${rateCheck.retryAfterSec} seconds before requesting a new code.`
      });
    }

    const otp = emailOtpStore.generateOtp(cleanEmail);
    const dispatchResult = await emailService.sendOtpEmail(cleanEmail, otp);

    if (!dispatchResult.success) {
      return res.status(500).json({ error: dispatchResult.error || 'Failed to send verification email.' });
    }

    return res.json({
      success: true,
      message: 'Verification code sent to your email.',
      isSimulated: dispatchResult.isSimulated
    });
  } catch (err: any) {
    console.error('API /send-otp error:', err);
    return res.status(500).json({ error: 'Internal server error processing OTP request.' });
  }
});

/**
 * POST /api/email/verify-and-send
 * Body: { email, otp, roomCode, customMessage, whiteboardBase64, filesList, qaSummary, pollResults }
 */
emailRouter.post('/verify-and-send', async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      email,
      otp,
      roomCode,
      customMessage,
      whiteboardBase64,
      filesList,
      qaSummary,
      pollResults
    } = req.body;

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
    }
    if (!roomCode) {
      return res.status(400).json({ error: 'Missing room code.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const verifyResult = emailOtpStore.verifyOtp(cleanEmail, otp.trim());
    if (!verifyResult.success) {
      return res.status(400).json({ error: verifyResult.error || 'Invalid or expired OTP.' });
    }

    // OTP is valid -> dispatch notes package
    const sendResult = await emailService.sendNotesPackage({
      toEmail: cleanEmail,
      roomCode,
      customMessage,
      whiteboardBase64,
      filesList,
      qaSummary,
      pollResults
    });

    if (!sendResult.success) {
      return res.status(500).json({ error: sendResult.error || 'Failed to dispatch notes email.' });
    }

    return res.json({
      success: true,
      message: 'Notes package successfully delivered to your inbox!',
      isSimulated: sendResult.isSimulated
    });
  } catch (err: any) {
    console.error('API /verify-and-send error:', err);
    return res.status(500).json({ error: 'Internal server error sending notes package.' });
  }
});
