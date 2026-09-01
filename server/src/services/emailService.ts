import { Resend } from 'resend';
import { CONFIG } from '../config.js';

class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (CONFIG.RESEND_API_KEY) {
      this.resend = new Resend(CONFIG.RESEND_API_KEY);
    }
  }

  /**
   * Send 6-digit OTP verification email
   */
  public async sendOtpEmail(toEmail: string, otp: string): Promise<{ success: boolean; error?: string; isSimulated?: boolean }> {
    const cleanEmail = toEmail.trim().toLowerCase();

    if (!this.resend) {
      console.log(`\n========================================`);
      console.log(`[SIMULATED EMAIL - RESEND_API_KEY NOT SET]`);
      console.log(`To: ${cleanEmail}`);
      console.log(`Verification Code: ${otp}`);
      console.log(`========================================\n`);
      return { success: true, isSimulated: true };
    }

    try {
      const { error } = await this.resend.emails.send({
        from: CONFIG.RESEND_FROM_EMAIL,
        to: cleanEmail,
        subject: `Your iChatWorld Verification Code: ${otp}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #FAFAFA; border-radius: 20px; border: 1px solid #E5E5EA;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #1C1C1E; font-size: 24px; font-weight: 700; margin: 0 0 8px;">iChatWorld Verification</h2>
              <p style="color: #8E8E93; font-size: 14px; margin: 0;">Confirm your email to receive your notes and homework package.</p>
            </div>
            
            <div style="background: #FFFFFF; border-radius: 16px; padding: 28px; text-align: center; border: 1px solid #E5E5EA; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
              <p style="color: #636366; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px;">Your 6-Digit Code</p>
              <div style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #007AFF; margin: 0 0 16px;">
                ${otp}
              </div>
              <p style="color: #8E8E93; font-size: 13px; margin: 0;">This code expires in 5 minutes. If you did not request this, you can safely ignore this email.</p>
            </div>

            <div style="text-align: center; margin-top: 24px; color: #AEAEB2; font-size: 12px;">
              <p style="margin: 0;">iChatWorld — Ephemeral peer-to-peer collaboration • No server retention</p>
            </div>
          </div>
        `
      });

      if (error) {
        console.error('Resend sendOtp error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('EmailService.sendOtp exception:', err);
      return { success: false, error: err.message || 'Failed to dispatch email' };
    }
  }

  /**
   * Send exported notes, custom message, whiteboard snapshot and files overview
   */
  public async sendNotesPackage(params: {
    toEmail: string;
    roomCode: string;
    customMessage?: string;
    whiteboardBase64?: string;
    filesList?: Array<{ filename: string; sizeFormatted: string; uploaderName: string }>;
    qaSummary?: Array<{ question: string; author: string; answer?: string }>;
    pollResults?: Array<{ question: string; options: Array<{ text: string; votes: number }> }>;
  }): Promise<{ success: boolean; error?: string; isSimulated?: boolean }> {
    const { toEmail, roomCode, customMessage, whiteboardBase64, filesList, qaSummary, pollResults } = params;
    const cleanEmail = toEmail.trim().toLowerCase();

    const attachments: any[] = [];
    if (whiteboardBase64) {
      const base64Data = whiteboardBase64.replace(/^data:image\/\w+;base64,/, '');
      attachments.push({
        filename: `whiteboard-room-${roomCode}.png`,
        content: Buffer.from(base64Data, 'base64')
      });
    }

    let filesHtml = '';
    if (filesList && filesList.length > 0) {
      filesHtml = `
        <div style="margin-top: 20px; background: #FFFFFF; border-radius: 14px; padding: 20px; border: 1px solid #E5E5EA;">
          <h4 style="margin: 0 0 12px; color: #1C1C1E; font-size: 15px;">📁 Shared Files Summary (${filesList.length})</h4>
          <ul style="margin: 0; padding-left: 20px; color: #3A3A3C; font-size: 14px; line-height: 1.6;">
            ${filesList.map(f => `<li><strong>${f.filename}</strong> (${f.sizeFormatted}) — uploaded by ${f.uploaderName}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    let customMsgHtml = '';
    if (customMessage && customMessage.trim()) {
      customMsgHtml = `
        <div style="margin-top: 20px; background: #FFFFFF; border-radius: 14px; padding: 20px; border: 1px solid #E5E5EA;">
          <h4 style="margin: 0 0 10px; color: #1C1C1E; font-size: 15px;">📝 Homework & Notes</h4>
          <div style="white-space: pre-wrap; font-size: 14px; color: #3A3A3C; line-height: 1.6;">${customMessage.trim()}</div>
        </div>
      `;
    }

    let qaHtml = '';
    if (qaSummary && qaSummary.length > 0) {
      qaHtml = `
        <div style="margin-top: 20px; background: #FFFFFF; border-radius: 14px; padding: 20px; border: 1px solid #E5E5EA;">
          <h4 style="margin: 0 0 12px; color: #1C1C1E; font-size: 15px;">❓ Q&A Key Takeaways (${qaSummary.length})</h4>
          <div style="font-size: 13px; color: #3A3A3C;">
            ${qaSummary.map(q => `
              <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #F2F2F7;">
                <p style="margin: 0 0 4px; font-weight: 600;">Q: ${q.question} <span style="font-weight: normal; color: #8E8E93;">(by ${q.author})</span></p>
                ${q.answer ? `<p style="margin: 0; color: #007AFF;">A: ${q.answer}</p>` : `<p style="margin: 0; color: #8E8E93; font-style: italic;">Unanswered</p>`}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (!this.resend) {
      console.log(`\n========================================`);
      console.log(`[SIMULATED EMAIL - NOTES PACKAGE]`);
      console.log(`To: ${cleanEmail}`);
      console.log(`Room: ${roomCode}`);
      console.log(`Custom Notes: ${customMessage || 'None'}`);
      console.log(`Attachments: ${attachments.length > 0 ? attachments[0].filename : 'None'}`);
      console.log(`========================================\n`);
      return { success: true, isSimulated: true };
    }

    try {
      const { error } = await this.resend.emails.send({
        from: CONFIG.RESEND_FROM_EMAIL,
        to: cleanEmail,
        subject: `Your iChatWorld Notes & Homework Package [Room ${roomCode}]`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #FAFAFA; border-radius: 20px; border: 1px solid #E5E5EA;">
            <div style="margin-bottom: 24px; border-bottom: 1px solid #E5E5EA; padding-bottom: 16px;">
              <h2 style="color: #1C1C1E; font-size: 22px; font-weight: 700; margin: 0 0 4px;">iChatWorld Session Package</h2>
              <p style="color: #8E8E93; font-size: 13px; margin: 0;">Room Code: <strong style="font-family: monospace; color: #007AFF;">${roomCode}</strong> • Generated on ${new Date().toLocaleDateString()}</p>
            </div>

            ${customMsgHtml}
            ${whiteboardBase64 ? '<div style="margin-top: 20px; background: #FFFFFF; border-radius: 14px; padding: 16px; border: 1px solid #E5E5EA; text-align: center;"><p style="margin: 0; color: #636366; font-size: 13px;">🎨 Whiteboard Diagram attached as high-resolution PNG.</p></div>' : ''}
            ${filesHtml}
            ${qaHtml}

            <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E5EA; color: #8E8E93; font-size: 12px;">
              <p style="margin: 0;">This email was sent on your request from iChatWorld. All session data is ephemeral and is not stored on our servers.</p>
            </div>
          </div>
        `,
        attachments
      });

      if (error) {
        console.error('Resend sendNotesPackage error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('EmailService.sendNotesPackage exception:', err);
      return { success: false, error: err.message || 'Failed to dispatch notes email' };
    }
  }
}

export const emailService = new EmailService();
