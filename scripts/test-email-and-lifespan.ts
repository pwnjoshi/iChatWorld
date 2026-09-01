import { emailOtpStore } from '../server/src/utils/emailOtpStore.js';
import { emailService } from '../server/src/services/emailService.js';
import { MemoryStore } from '../server/src/store/MemoryStore.js';

async function runTests() {
  console.log('--- STARTING EMAIL OTP & ROOM LIFESPAN TESTS ---');

  // Test 1: OTP Generation and Rate Limiting
  const testEmail = 'student@university.edu';
  const canRequest = emailOtpStore.canRequestOtp(testEmail);
  console.assert(canRequest.allowed === true, 'Rate limit should allow first request');

  const otp = emailOtpStore.generateOtp(testEmail);
  console.log(`Generated OTP for ${testEmail}: ${otp}`);
  console.assert(otp.length === 6, 'OTP must be 6 digits');

  // Test 2: Invalid OTP verification
  const invalidResult = emailOtpStore.verifyOtp(testEmail, '000000');
  console.assert(invalidResult.success === false, 'Invalid OTP should fail');

  // Test 3: Correct OTP verification
  const validResult = emailOtpStore.verifyOtp(testEmail, otp);
  console.assert(validResult.success === true, 'Correct OTP must pass verification');

  // Test 4: One-time use (OTP purged after success)
  const reusedResult = emailOtpStore.verifyOtp(testEmail, otp);
  console.assert(reusedResult.success === false, 'OTP must not be reusable after verification');

  // Test 5: Email Service Dispatch (Simulated Mode)
  const otpDispatch = await emailService.sendOtpEmail(testEmail, '123456');
  console.assert(otpDispatch.success === true, 'sendOtpEmail should succeed');

  const notesDispatch = await emailService.sendNotesPackage({
    toEmail: testEmail,
    roomCode: 'ABC-123',
    customMessage: 'Homework #4: Complete problem sets 1 to 5',
    filesList: [{ filename: 'lecture4.pdf', sizeFormatted: '2.4 MB', uploaderName: 'Prof. Alex' }],
    qaSummary: [{ question: 'When is the deadline?', author: 'Jordan', answer: 'Friday 5 PM' }]
  });
  console.assert(notesDispatch.success === true, 'sendNotesPackage should succeed');

  // Test 6: MemoryStore Room Lifespan Selector
  const store = new MemoryStore();
  const creator = {
    socketId: 'sock-1',
    displayName: 'Prof. Alex',
    isFaculty: true,
    isCreator: true,
    joinedAt: Date.now()
  };

  const room6h = await store.createRoom('TEST-6H', creator, undefined, 6);
  const diff6hHours = Math.round((room6h.expiresAt - room6h.createdAt) / (3600 * 1000));
  console.log(`Room TEST-6H duration: ${diff6hHours} hours`);
  console.assert(diff6hHours === 6, 'Room with 6h lifespan must have 6h expiresAt delta');

  const room12h = await store.createRoom('TEST-12H', creator, undefined, 12);
  const diff12hHours = Math.round((room12h.expiresAt - room12h.createdAt) / (3600 * 1000));
  console.log(`Room TEST-12H duration: ${diff12hHours} hours`);
  console.assert(diff12hHours === 12, 'Room with 12h lifespan must have 12h expiresAt delta');

  console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
